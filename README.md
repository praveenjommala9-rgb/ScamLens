# ScamLens

**See the signal. Stop the scam.**

ScamLens is an adaptive phishing-awareness trainer. People complete an eight-scenario baseline, practice safely simulated messages with server-side grading and short Gemini coaching, then take a new eight-scenario assessment to measure progress. Scenario addresses use fictional `.example` domains and are shown as non-clickable text.

## Project layout

- `artifacts/scamlens` — responsive React/Vite client with the six product routes.
- `artifacts/api-server` — Express REST API, authentication checks, grading, adaptive selection, and server-only Gemini calls.
- `lib/api-spec` — OpenAPI source contract.
- `lib/api-client-react` — generated React Query client.
- `lib/api-zod` — generated request/response validation schemas.
- `supabase/migrations` — PostgreSQL schema, constraints, RPC, triggers, and row-level security.
- `supabase/seed.sql` — 40 fictional scenarios across eight categories and three difficulties.
- `docs` — architecture, API, security, and demo notes.

## Supabase setup

ScamLens uses Supabase Auth and PostgreSQL. Before using the authenticated product flows:

1. Create or select a Supabase project and enable email/password sign-in.
2. Add these values to Replit Secrets (never to client source, commits, or chat):
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `GEMINI_API_KEY`
3. In the Supabase SQL Editor, run `supabase/migrations/20261006000100_scamlens_core.sql`.
4. Then run `supabase/seed.sql`. The seed script is safe to re-run and updates only its stable scenario IDs.
5. Sign up through ScamLens. The database trigger creates the corresponding user profile.

The browser receives only the Supabase URL and publishable key from `GET /api/config` for authentication. Application data and business logic go through Express. The secret key and Gemini key are used only by the API server.

To enable scenario-management endpoints, promote a trusted account from the Supabase SQL Editor after signing up:

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID';
```

## Run and verify

The web and API workflows are configured in this Replit workspace. For local command-line checks:

```sh
pnpm install
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run test
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/scamlens run typecheck
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/scamlens run build
```

An opt-in real-provider smoke test sends one fictional scenario to Gemini (and may incur provider usage):

```sh
SCAMLENS_LIVE_GEMINI_TEST=1 pnpm --filter @workspace/api-server run test -- src/lib/coach.integration.test.ts
```

The Vite configuration requires both `PORT` and `BASE_PATH` when loading its config, including for production builds. Use `PORT=5173 BASE_PATH=/` for the root ScamLens artifact. Managed Replit workflows inject both values. The API server also requires `PORT` when started. Optional `CORS_ORIGINS` is a comma-separated allowlist of browser origins; authentication is still required regardless of CORS.

## Product flow

1. Sign up or sign in with Supabase Auth.
2. Complete the balanced baseline assessment; answers are not graded visibly until all eight are submitted.
3. Use adaptive practice to focus on recent weak categories and difficulty.
4. Review deterministic results and, when Gemini returns schema-valid coaching, one practical coaching note.
5. Complete the final assessment, which excludes the exact baseline scenario IDs, and review the comparison report.
6. Review past responses in private history.

## Architecture and safety

- See [Architecture](docs/ARCHITECTURE.md), [API](docs/API.md), [Security](docs/SECURITY.md), and [Demo flow](docs/DEMO_SCRIPT.md).
- The grading answer key and assessment correctness are server-controlled. Assessment item correctness and explanation are not returned by the API or exposed by the authenticated assessment-attempt RLS policy.
- Session submission is an atomic PostgreSQL function that verifies ownership, order, and session state and prevents duplicate responses.
- Admin scenario content is frozen after it has been used; removal is a soft deactivation.
- ScamLens is a training simulator, not a live URL scanner. It never fetches, crawls, or opens scenario URLs.

## Current verification boundary

The API unit/security tests and TypeScript checks can run without a live Supabase database. The Supabase migration and seed must be applied to a project before sign-up, persistence, RLS, and the complete baseline-to-final flow can be verified end to end. Gemini coaching is explicitly reported as unavailable if the key, provider, response schema, or persistence step fails; no placeholder AI feedback is substituted.

