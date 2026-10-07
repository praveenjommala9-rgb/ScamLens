# ScamLens architecture

## Request flow

```text
React/Vite client
  ├─ Supabase Auth (sign-up, sign-in, session refresh)
  └─ Express REST API with the current Supabase bearer token
       ├─ verifies token with Supabase Auth
       ├─ scopes user data to the verified user ID
       ├─ runs deterministic grading and adaptive selection
       ├─ calls Gemini only from the API server for training feedback
       └─ reads/writes Supabase PostgreSQL
```

The browser uses Supabase only for authentication. It receives the URL and publishable key from `GET /api/config`. All application data and decisions use the REST API and generated OpenAPI client. `SUPABASE_SECRET_KEY` and `GEMINI_API_KEY` are never sent to the browser.

## Data model

The migration creates exactly five application tables:

- `profiles` — user display name and `user`/`admin` role.
- `scenarios` — safe display fields plus server-only answer, red flags, and explanation.
- `sessions` — owner, mode, ordered server-selected scenario IDs, progress, and final score.
- `attempts` — the user's answer, selected signals, server-computed correctness, response time, and reflection.
- `ai_feedback` — validated coaching attached to a training attempt.

Foreign keys preserve ownership and delete behavior. Indexes cover user history, category/difficulty scenario selection, and uniqueness. A partial unique index permits only one in-progress session per user.

## Session and grading flow

1. The API verifies the Supabase access token and derives the user ID from the verified identity.
2. It selects eight scenarios from active `.example`-only content. Baseline and final each contain one scenario per category; final excludes baseline IDs.
3. The API returns only safe scenario fields. The `correct_answer`, authoritative red flags, and explanation are omitted from scenario reads.
4. On submission, the server fetches the answer key, grades the response, and calls `submit_scam_attempt`.
5. The database function locks the session, checks owner/status/order, writes one response, advances the cursor, and finalizes the score atomically.
6. Training returns the deterministic explanation immediately. Baseline/final return no per-item grading or coaching; the report appears only after all eight submissions.

Assessment attempt rows are not visible through the authenticated table policy, even after completion. The API reads history with the service key only after verifying the request JWT, and filters every user-data query by that verified user ID.

## Adaptive practice

The picker evaluates up to the latest three outcomes per category:

- Below 60%: prioritize the category and prefer easy scenarios.
- 60–80%: prefer medium scenarios.
- Above 80% after at least three outcomes: prefer hard scenarios.
- Categories with no outcomes use a neutral 50% estimate and do not count as measured for coaching.

The selection favors weaker categories, avoids the user's most recent scenario IDs when possible, and never repeats an ID within a session. Training sessions remain eight questions long.

## Gemini coaching

Only training attempts call Gemini. The server sends the scenario and reflection as untrusted data, along with authoritative server-generated grade context. Gemini must return a structured JSON object; Zod enforces field bounds, category identity, and that feedback signals match the deterministic grader. Only validated output is stored in `ai_feedback`. Provider, validation, and persistence failures do not undo the saved attempt; the API marks coaching unavailable and keeps the deterministic result.

