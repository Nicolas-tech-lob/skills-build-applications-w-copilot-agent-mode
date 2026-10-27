# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: React views use the shared API client and display loading, error, empty, and data states.
- Logic tier decision: Express routes delegate validation and business rules to service functions, which return deliberate 4xx responses for invalid input.
- Data tier decision: Mongoose schemas enforce required fields and references; the seed uses idempotent upserts and preserves existing data.
- Activity tracking approach: Validate the IDs and existence of the user and team, then store the activity with computed points and its date.
- Team management approach: Require a team name and preserve its name, mascot, and member references.
- Leaderboard approach: Sum activity points by team and return teams in descending order with 1-based ranks.
- Workout suggestions approach: Match suggestions to the user's goal or recent activity; return a 4xx response if the user is unknown.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - PASS (5/5); a failure indicates a schema validation or seed idempotency/preservation regression.
- API command: `npm run test:api --prefix octofit-tracker/backend` - PASS (4/4); a failure indicates an API response, validation, persistence, ranking, or recommendation contract regression.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - PASS (15/15); a failure indicates a data rendering, route request, or loading/empty/error state regression.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - PASS; a failure indicates a backend TypeScript compilation error.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - PASS; a failure indicates a frontend type-check or Vite production-build error.
- Integrated final check: `node .github/scripts/grade-step.mjs step5-final` - PASS (2026-10-27).
