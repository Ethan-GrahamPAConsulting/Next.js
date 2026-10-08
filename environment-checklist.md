# CoSpace Test Tool Environment Checklist

Source review date: 2026-10-08. This compares the requested curriculum tools
with the current frontend and backend package manifests. It describes useful
smoke checks; it does not claim these tests are installed or have been run.

## Current Environment

- Frontend package: [package.json](package.json). Scripts are `dev`, `build`,
  `start`, and `lint`. It includes Next.js, React, Axios, and ESLint. There is no
  test script and no declared Jest, React Testing Library, Playwright, or Cypress.
- Backend package: [package.json](../cospace-backend/backend-api/package.json).
  The `test` script is a placeholder that exits unsuccessfully. It includes
  Express, Prisma, TypeScript, and `ts-node-dev`; no Supertest or Jest is declared.
- No matching frontend or backend test/spec files were found in the inspected
  project trees.
- This is a comparison only. Do not install or introduce another test runner as
  part of these checks without a separate decision.

## Tool Checklist

| Tool | What it executes | CoSpace boundary | Does not test | Smallest useful smoke check | Present in package manifests? |
| --- | --- | --- | --- | --- | --- |
| Jest | Runs JavaScript/TypeScript tests with assertions, mocks, and fake timers. Jest is a test runner, not a browser UI library. | Directly call pure logic such as `validateBooking` from [CreateBookingForm.tsx](src/app/components/CreateBookingForm.tsx), or test `BookingService` with a mocked repository. | Real browser behavior, CSS rendering, and database persistence when dependencies are mocked. | Assert that a trimmed desk name shorter than the confirmed three-character minimum produces a desk validation error. | No |
| React Testing Library | Renders React into a simulated DOM and interacts through accessible queries/events; it is a component-testing library, normally paired with a runner. | Render [RegistrationForm.tsx](src/app/components/RegistrationForm.tsx) with desk options and mocked callbacks. | Real browser rendering, Express, and actual DB writes. | Select a desk, choose a date, submit, and assert `onRegister` receives the selected `deskId` and date. | No |
| Supertest | Sends HTTP requests into an Express application and asserts status, headers, and response. It is normally paired with a runner. | Exercise [booking.routes.ts](../cospace-backend/backend-api/src/routes/booking.routes.ts) and middleware, using mocks or a real database. | Browser UI, React state, CSS, and browser-enforced CORS behavior. | Request `GET /bookings`; assert HTTP 200 and a `{ data, meta }` response shape. Use a real DB only when checking Prisma persistence. | No |
| Playwright | Drives a real browser; can serve as a browser test runner and automation library. | Test [page.tsx](src/app/page.tsx) against a running frontend and optionally real API/database. | Isolated service logic. Mocked requests do not prove the real API or DB. | Open the dashboard and assert a known `BookingCard` is visible after loading. Use a controlled test fixture. | No |
| Cypress | Runs browser-driven tests with its own runner and browser assertions. | Test dashboard workflows such as sign-in, modal, form submission, and card rendering. | Isolated service decisions and real persistence if API calls are intercepted. | Visit the dashboard and assert a known booking card appears from a fixture or test DB. | No |

## Choose the Boundary Deliberately

- Jest and React Testing Library complement each other: Jest runs the test;
  Testing Library exercises component behavior.
- Supertest covers the Express HTTP boundary. A mocked service isolates routing
  and middleware; a real Prisma repository and isolated MySQL instance add
  persistence coverage.
- Playwright and Cypress both cover browser workflows. Usually choose one if a
  browser suite is adopted; using both for the same paths duplicates effort.
- A mocked browser test is not full-stack E2E. It proves frontend behavior
  against the mock, not backend persistence.
- The dashboard's search currently filters loaded records locally. A search
  smoke test should assert that visible cards change, not expect another HTTP
  search request.
- Booking creation can be covered at several levels for distinct evidence:
  unit validation, component submission behavior, API/database integration, and
  end-to-end persistence. Keep most input boundary cases at lower levels.

## Suggested Smoke Check Order

1. **Unit boundary:** validate representative valid and invalid booking values.
2. **Component boundary:** submit `RegistrationForm`; observe selected values,
   disabled/loading state, error alert, and callback.
3. **API boundary:** exercise `GET /bookings`; for create, provide valid auth and
   fixtures, then verify HTTP 201 and the saved row.
4. **Browser boundary:** sign in, create a booking using a controlled fixture,
   reload, and verify the persisted result in the dashboard.

The backend schema requires a positive integer `desk_id`, coerces
`booking_date` to a date, and accepts optional boolean `active`. It does not
prohibit past dates. The backend derives booking ownership from the authenticated
token. Do not infer administrator permissions or a frontend detail route from
these facts.

## Missing Environment Decisions

- Which existing or approved test runner should execute unit/component tests?
- Will integration tests use a dedicated MySQL database, and how will fixtures
  and cleanup be isolated?
- Which one browser tool, if any, should be adopted: Playwright or Cypress?
- Are administrator-specific permissions required, or only authenticated-user
  booking creation?
- What are the expected duplicate desk/date response and user-facing message?

Until these are answered, treat the smoke checks as a plan and avoid adding
packages or claiming automated test coverage.
