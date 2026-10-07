# ScamLens security model

## Authentication and authorization

- Supabase Auth handles sign-up, sign-in, and browser session refresh.
- Every non-public API route requires a bearer token verified by `auth.getUser(token)`. The server ignores any user ID supplied by a client and derives it from the verified identity.
- Admin endpoints check the current profile role on every request; the client cannot grant itself admin status.
- Service-key reads/writes are server-only and filter user data by the verified user ID. User input cannot choose another owner's ID.

## PostgreSQL and RLS

RLS is enabled on all five application tables. Profiles and sessions are limited to their owner. Authenticated scenario reads receive only safe display columns. The answer key, red flags, and grading explanation are not granted to browser clients. Authenticated attempt-row RLS allows training attempts only; baseline/final item correctness remains unavailable even after completion. The service role is used by Express for verified, owner-scoped history and scoring queries.

Only the API server can write sessions, attempts, scenarios, or AI feedback. `submit_scam_attempt` is executable only by `service_role`, validates session ownership and sequence under a row lock, and performs the attempt/cursor/score update atomically. Profiles permit users to update only their own name. Admin content updates are rejected after a scenario has been used; delete is a soft deactivation.

## Secrets and Gemini

Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY` through Replit Secrets. Do not add actual values to source, `.env.example`, frontend variables, logs, seed data, or chat. The Supabase secret key and Gemini key are used only by the API server.

Gemini is called only for training feedback. Scenario text and reflection are treated as untrusted prompt data. The server validates structured output and verifies feedback signal references against deterministic grading before persistence. Gemini failure is non-fatal to attempt storage and is reported explicitly; no generated placeholder is used.

## Inputs, network, and logs

- OpenAPI-generated Zod schemas validate request parameters and bodies.
- Helmet sets HTTP security headers; JSON bodies are limited to 32 KiB.
- CORS responses are restricted to `CORS_ORIGINS`; CORS is not treated as authentication.
- The API has a global rate limit and a lower per-user response-submission limit.
- Logs omit authorization, cookie, and set-cookie headers. Gemini prompt text and secret values are not logged.
- Scenario sender/display addresses must use `.example`; the app renders them as text.
- ScamLens never makes server-side requests to user-provided or scenario-provided URLs, crawls pages, or executes external scripts.

## Remaining operational requirement

The migration and seed file must be applied to the target Supabase project before authenticated application flows can run. Confirm Supabase Auth email/password settings, apply RLS, and test with separate regular/admin accounts before publishing.

