# CoSpace Testing Runbook

Verified 2026-10-08. This runbook describes the current test setup and clearly
marks commands whose test suites/configuration have not been added yet.

## Project Paths and Runners

| Project | Path | Test runner and environment |
| --- | --- | --- |
| Frontend | `cospace-web/` | Jest 30 with Next's `next/jest` transformer and jsdom; React Testing Library is available for component tests. |
| Backend API | `cospace-backend/backend-api/` (inside the `cospace-backend/` Git repository) | Jest 29 with ts-jest and Node environment. |

Run frontend commands from `cospace-web/` and backend commands from
`cospace-backend/backend-api/`.

## Tool Responsibility Map

| Tool | Project | Boundary | Command | Required services/data |
| --- | --- | --- | --- | --- |
| Jest + React Testing Library | Frontend | Unit and component behavior; React controls, accessible messages, modal behavior, and client state. | `npm test -- --runInBand testing/unit` or `npm test -- --runInBand testing/integration` | Jest/jsdom only for the current smoke test and mocked component tests. Real API/DB not required when requests are mocked. |
| Jest + ts-jest | Backend API | Unit tests for schemas/services and backend environment. | `npm test -- --runInBand testing/unit` | Node/Jest. Use mocked repositories for isolated service tests. |
| Jest + Supertest | Backend API | Express integration: routes, middleware, controllers, services, and optionally Prisma persistence. | `npm test -- --runInBand testing/integration` | For HTTP-only tests, the Express app and isolated fixtures. For persistence checks, a dedicated migrated MySQL test database, valid test user/token and desk. Supertest is not currently declared in the backend package. |
| Playwright | Frontend / full stack | Browser E2E across Next.js, Express, and (when testing persistence) MySQL. | `npx playwright test` | Installed Playwright browser; web server at port 3000; API at port 5000; test account, desk and isolated booking data for full-stack tests. No Playwright config/specs currently exist. |
| Cypress (alternative browser E2E) | Frontend / full stack | Same browser boundary as Playwright; choose one browser tool for a given suite to avoid duplication. | `npx cypress run` | Cypress binary; web server at port 3000; API at port 5000; test account, desk and isolated booking data for full-stack tests. No Cypress config/specs currently exist. |

### Current Versus Planned Commands

Current unit/environment smoke tests:

```sh
# From cospace-web/
npm test -- --runInBand testing/unit/environment.test.ts

# From cospace-backend/backend-api/
npm test -- --runInBand testing/unit/environment.test.ts
```

The unit-directory commands are runnable now and select the current smoke test.
The integration commands are the intended commands when integration test files
are added. The Playwright and Cypress commands require their respective config
and spec files, which do not currently exist.

## Services and URLs

| Service | Start command | URL |
| --- | --- | --- |
| Next.js frontend | From `cospace-web/`: `npm run dev` | `http://localhost:3000` |
| Express API | From `cospace-backend/backend-api/`: `npm run dev` | `http://localhost:5000` by default |

The API's `PORT` environment variable can override port 5000. Its
`COSPACE_WEB_ORIGIN` setting defaults to `http://localhost:3000` for CORS.

## Browser Installation

From `cospace-web/`, install Playwright's supported browsers with:

```sh
npx playwright install
```

The installed CLI versions were checked with:

```sh
npx playwright --version
npx cypress version
```

## Test Data and Database Isolation

- Point `DATABASE_URL` at a dedicated test database for tests that touch Prisma;
  never use a production database or a shared developer database for destructive
  test data.
- Apply the backend migrations to that test database before running persistence
  tests. Use known test users and desk fixtures, and clean up created bookings
  and users after each test or suite.
- Supply a test-only `JWT_SECRET` for authenticated API tests. Do not commit
  secrets or copy values from a local `.env` file into this runbook.
- `POST /bookings` derives its owner from the bearer token. Tests should not send
  `user_id` as a client-selected owner.
- The database declares unique constraints for desk/date and user/desk/date;
  give parallel tests distinct fixtures or cleanly isolate/serialize them.
- `GET /bookings` is paginated (default limit 10, maximum 50). E2E checks should
  seed or request the test booking so it is in the page under assertion, rather
  than assuming every booking appears in the first result page.
- Unit and component tests should mock repositories or HTTP as appropriate and
  should not need database records. Mocked API responses do not prove persistence.

## Recorded Smoke-Test Results

| Command | Result |
| --- | --- |
| Frontend: `npm test -- --runInBand testing/unit/environment.test.ts` | Passed: 1 suite, 1 test; jsdom provided `window` and a DOM element. |
| Backend: `npm test -- --runInBand testing/unit/environment.test.ts` | Passed: 1 suite, 1 test; Node was available and `window` was undefined. |
| `npx playwright --version` (from `cospace-web/`) | `Version 1.64.0` |
| `npx cypress version` (from `cospace-web/`) | Cypress package 16.1.1; Cypress binary 16.1.1; Electron 41.7.0; bundled Node 24.15.0. |

These results verify the current Jest smoke environments and installed browser
CLI versions only. They do not demonstrate booking API integration, database
persistence, or a passing browser E2E suite.
