# ScamLens REST API

All application endpoints are mounted under `/api`. Except for health and configuration, requests require:

```http
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```

The source of truth is `lib/api-spec/openapi.yaml`. Request and response validators and the React client are generated from it.

## Public endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/healthz` | Liveness check |
| GET | `/api/health` | Health response |
| GET | `/api/config` | Supabase URL and publishable key for browser authentication |

## Authenticated endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/me` | Get the signed-in profile |
| PATCH | `/api/me` | Update the profile display name |
| GET | `/api/dashboard` | Dashboard metrics, category performance, recent attempts, and active session |
| GET | `/api/progress` | Progress summary |
| POST | `/api/sessions` | Create a server-selected baseline, training, or final session |
| GET | `/api/sessions/{id}` | Get an owned session |
| GET | `/api/sessions/{id}/next` | Get its next safe scenario projection |
| POST | `/api/attempts` | Submit the current response |
| GET | `/api/attempts` | List attempts; accepts `search`, `category`, `channel`, `session_type`, and `limit` |
| GET | `/api/attempts/{id}` | Get an owned response and permitted result details |
| PATCH | `/api/attempts/{id}` | Update only the private reflection note |

`POST /api/sessions` accepts `{"type":"baseline"}`, `{"type":"training"}`, or `{"type":"final"}`. It rejects a second active session, training/final before baseline, and a repeated completed baseline.

`POST /api/attempts` accepts `session_id`, `scenario_id`, `answer`, `selected_red_flags`, and `response_time_ms`, with optional `reflection_note`. It does not accept a score, correctness value, scenario list, or answer key. The server checks that the scenario is the current session item.

For baseline/final submissions, `grading` and `feedback` are `null` and `ai_status` is `not_applicable`. The completed assessment report is returned only after the eighth response. Training submissions return deterministic `grading`; `feedback` is either schema-validated Gemini output or `null` with `ai_status: "unavailable"`.

## Admin scenario endpoints

These additionally require `profiles.role = 'admin'`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/scenarios` | List scenario records, including server-only fields for administrators |
| POST | `/api/admin/scenarios` | Create a scenario |
| PATCH | `/api/admin/scenarios/{id}` | Update an unused scenario or change its active status |
| DELETE | `/api/admin/scenarios/{id}` | Soft-deactivate a scenario |

Scenario addresses are restricted to `.example`. Scenario content cannot be changed after an attempt references it, preserving historical grading.

## Errors and limits

Errors use `{ "error": { "code": "...", "message": "..." } }`. Invalid requests return `400`, unauthenticated requests `401`, non-admin requests `403`, and stale/out-of-order submissions `409`. The API applies a global per-IP limit and a tighter per-user limit to response submissions.

