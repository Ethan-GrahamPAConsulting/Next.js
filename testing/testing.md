# CoSpace Testing Strategy

Source review date: 2026-10-08.

This document consolidates the CoSpace testing discussion. Source-confirmed
behavior is distinguished from assumptions, hypothetical checks, and proposed
tests. It is not an automated test suite or a report that all checks have passed.

## 1. Source Evidence

| Layer | Relevant source |
| --- | --- |
| Dashboard, loading, search, authentication, and optimistic booking state | [page.tsx](../src/app/page.tsx) |
| Shared Axios configuration | [api.ts](../src/lib/api.ts) |
| Dashboard booking form | [RegistrationForm.tsx](../src/app/components/RegistrationForm.tsx) |
| Standalone form validation and focus management | [CreateBookingForm.tsx](../src/app/components/CreateBookingForm.tsx) |
| Card, table, and modal UI | [BookingCard.tsx](../src/app/components/BookingCard.tsx), [BookingsTable.tsx](../src/app/components/BookingsTable.tsx), [BaseModal.tsx](../src/app/components/BaseModal.tsx) |
| Express application and error handling | [index.ts](../../cospace-backend/backend-api/src/index.ts), [errorHandler.ts](../../cospace-backend/backend-api/src/middleware/errorHandler.ts) |
| Booking routes and authentication | [booking.routes.ts](../../cospace-backend/backend-api/src/routes/booking.routes.ts), [requireAuth.ts](../../cospace-backend/backend-api/src/middleware/requireAuth.ts) |
| Authentication and desk routes | [auth.routes.ts](../../cospace-backend/backend-api/src/routes/auth.routes.ts), [desk.routes.ts](../../cospace-backend/backend-api/src/routes/desk.routes.ts) |
| Booking request validation | [booking.schema.ts](../../cospace-backend/backend-api/src/schemas/booking.schema.ts) |
| Booking controller, service, and repository | [booking.controller.ts](../../cospace-backend/backend-api/src/controllers/booking.controller.ts), [booking.service.ts](../../cospace-backend/backend-api/src/services/booking.service.ts), [booking.repository.ts](../../cospace-backend/backend-api/src/repositories/booking.repository.ts) |
| Database models and constraints | [schema.prisma](../../cospace-backend/backend-api/prisma/schema.prisma) |

### Confirmed Behavior and Rules

- The current dashboard renders `BookingCard` components, not `BookingsTable`.
- `BookingsTable` exists separately and has Desk, Floor, Date, and Status headers.
- The dashboard uses `RegistrationForm`, which selects an existing desk and uses
  a required date input with a UTC-derived `min` value.
- `CreateBookingForm` is a separate component. Its validator checks a trimmed
  desk name of at least 3 characters, a trimmed floor of at least 5 characters,
  a valid calendar date, and no date before the current local day.
- Those standalone form rules must not be described as rules enforced by the
  dashboard form or the backend.
- The backend create schema requires a positive integer `desk_id`, coerces
  `booking_date` to a date, and accepts an optional boolean `active`.
- The backend booking schema does not prohibit past dates.
- The backend derives the booking owner from the authenticated token, not from
  a client-supplied owner.
- The service checks ownership before update, delete, or status toggle.
- The Prisma schema declares uniqueness for desk/date and user/desk/date.
- The dashboard uses typed `ColleagueOpportunity` records and paginated
  `{ data, meta }` responses. TypeScript types do not validate incoming JSON.
- The dashboard fetches the default bookings page and filters those loaded
  records locally. Typing into search does not start search requests.
- Initial Axios GET requests use an `AbortSignal`, with abort guards before
  updating state and effect cleanup that cancels the requests.
- Creation adds an optimistic card, replaces it with the successful API result,
  and removes it if the request fails. An optimistic card is not persistence
  evidence.
- Axios errors without a response produce this message:
  "The database server is currently offline. Please check your connection."
  A missing response can also indicate a network or CORS problem; the message
  alone does not diagnose an actual database outage.

### Confirmed Route Boundaries

| Route | Confirmed behavior |
| --- | --- |
| `GET /bookings` | Public paginated list; default limit 10, maximum 50; includes desk name and floor. |
| `GET /bookings/:id` | Public single-booking lookup. This does not establish a frontend detail page. |
| `POST /bookings` | Authenticated, schema-validated creation; successful controller response is HTTP 201. |
| `PUT /bookings/:id` | Authenticated, schema-validated update, with service ownership checks. |
| `PATCH /bookings/:id` | Authenticated status toggle, with service ownership checks. |
| `DELETE /bookings/:id` | Authenticated deletion, with service ownership checks. |
| `GET /desks` | Existing desk options for the selector. |
| `POST /auth/login` | Login used by the dashboard to obtain a bearer token. |
| `POST /auth/register` | Account registration route. |

## 2. Core Testing Concepts

| Concept | Meaning | Confirmed CoSpace example or proposed check |
| --- | --- | --- |
| Quality | How well the software meets requirements and users' needs. | `RegistrationForm` disables submission while saving, retains values on failure, and renders an accessible error alert. These support reliability and usability, but do not establish overall quality alone. |
| Defect | An implementation fault that causes incorrect behavior. | In the Express root handler, `GET /` throws before its success response, making that response unreachable. The throw may be intentional fault injection; it is not evidence that the database is broken. |
| Risk | A possible future failure and its impact. | The dashboard trusts typed Axios payloads without runtime validation. A missing `desk` relation could cause `booking.desk.name` to fail during rendering. This is a risk, not a confirmed occurrence. |
| Verification | Checking conformance to specified rules: did we build it correctly? | Test the actual Zod rules for `desk_id`, `booking_date`, and `active`, and verify that the frontend maps the API fields correctly. |
| Validation | Checking fitness for users' needs: did we build the right thing? | Have a user sign in, select a desk/date, submit, and confirm the persisted reservation remains available after reloading. |
| Regression | Previously working behavior breaking after a change. | After changing the API client or response structure, rerun loading, offline-message, cancellation, optimistic replacement, and rollback checks. These are regression-test examples, not claims of a current regression. |

Verification and validation are different activities. Matching an API schema
does not by itself establish that the booking workflow meets user needs.

## 3. User Story in AAA and Given-When-Then

### Provisional Story

> As an administrator, I want to create a desk booking so that the reservation
> is saved and visible in CoSpace.

No detailed administrator story was supplied. The implementation confirms
authenticated booking creation, but not administrator-specific permissions or
the ability to book on behalf of another colleague.

### Arrange-Act-Assert

- **Arrange:** Sign in with an authorised test account. Provide an existing desk
  fixture and a date that satisfies the dashboard form's constraints.
- **Act:** Select the desk and date in `RegistrationForm` and submit.
- **Assert:** Confirm a successful API response, matching persisted data,
  correctly rendered card values, modal closure, and persistence after reload.

### Given-When-Then

```gherkin
Given I am signed in with an authorised account
And I have selected an existing desk and a permitted date
When I submit the booking form
Then the API returns a created booking
And the saved booking appears in the dashboard
And the booking remains available after reloading
```

### Observable Assertion Evidence

| Assertion | Evidence |
| --- | --- |
| Creation succeeds | `POST /bookings` returns HTTP 201 and a booking with a server-generated ID. |
| The correct booking is saved | The response and persisted row match the selected `desk_id` and `booking_date`; the owner matches the authenticated user. |
| The card displays correctly | The card contains the returned desk name, floor, formatted date, and status. |
| Submission completes | The booking modal closes after a successful response. |
| The booking persists | A subsequent `GET /bookings/:id` retrieves the returned ID; reloading also displays the fixture when it is within the loaded page. |

Do not use "the page looks fine" or an immediately displayed optimistic card
as proof that the reservation was saved.

## 4. Testing Pyramid and Actual Layers

Classification depends on what runs together and what is mocked, not on file
names or tools alone.

| Level | Frontend mapping | Backend mapping |
| --- | --- | --- |
| Unit | Call `validateBooking` directly with boundary values and a fixed clock. Test the confirmed minimums, impossible dates, yesterday, and today. | Test schemas directly. Test service pagination calculations, existence checks, and ownership decisions with a mocked repository. |
| Component | Render a form, card, table, or modal independently. Check controlled values, pending states, error associations, success callbacks, and headers. | Test a controller independently with a mocked service and request/response objects; for example, creation returns the service result with HTTP 201. There is no browser rendering involved. |
| Integration | Render the dashboard, forms, and shared Axios client with mocked HTTP responses. Check mapping, optimistic replacement, rollback, and modal closure. | Exercise real Express middleware, controller, service, Prisma repository, and an isolated MySQL database. Check persistence, desk relations, and declared database constraints. |
| E2E | Use a real browser, Next.js, Express, and a test database. Sign in, select a desk/date, submit, reload, and confirm the saved reservation using a controlled fixture. | The same journey crosses the full backend path. An additional scenario can verify rejection of another user's modification without changing the record. |

Mocked HTTP tests do not prove real persistence. Linting and TypeScript checks
are verification aids, not substitutes for behavioral tests.

### Why Cover the Same Behavior at Multiple Levels?

Booking creation has different boundaries at each level:

- Unit checks isolate a particular validation or business decision.
- Component checks establish that user interaction invokes the right callbacks
  and displays pending/error states.
- Integration checks establish that authentication, request handling, and the
  database work together.
- E2E checks establish that the browser produces the right request and renders
  the persisted result through the actual stack.

This is complementary evidence, not a reason to repeat every boundary case
through a browser. Keep most boundary cases in faster lower-level tests.

## 5. Classification of the Six Checks

| Check | Classification | Boundary and minimum setup | Value of a higher level |
| --- | --- | --- | --- |
| 1. A desk-name validator rejects a name below its confirmed minimum. | Unit | Call the validator with a trimmed name shorter than 3 characters and valid floor/date values. Fix the clock. Assert the desk error. No React, HTTP, or database is needed. | A component test confirms submission invokes validation. E2E adds little confidence in the length calculation itself. |
| 2. `CreateBookingForm` displays an accessible validation message. | Component | Render the form with a mocked callback, submit invalid input, and assert the visible message, `role="alert"`, `aria-invalid`, and the correct `aria-describedby` target. | A browser adds confidence in focus, native controls, and CSS. DOM semantics alone do not prove actual screen-reader announcement; assistive-technology testing adds that evidence. |
| 3. `BookingService` rejects invalid business data with a mocked repository. | Unit | Instantiate the service with a mocked repository and exercise a confirmed business rule. Assert rejection and, where appropriate, no write. | Integration checks actual repository results and database constraints. As worded, this is hypothetical: the confirmed service checks ownership/existence; request-field validation is in Zod middleware. |
| 4. A Supertest request crosses middleware and persists a booking in MySQL. | Integration | Use real Express middleware, controller, service, Prisma, and an isolated migrated database. Supply a valid token and user/desk fixtures. Assert response and persisted row; clean up afterward. | E2E additionally exercises payload construction, browser CORS, modal interaction, and rendering. Supertest does not cross those browser boundaries. |
| 5. A browser user searches and opens a detail route. | E2E if it uses the real stack | Use a real browser, frontend/backend, and persisted fixtures; assert search, navigation, and displayed booking identity. A frontend detail route must first be confirmed. Mocked API responses make this frontend integration instead of full-stack E2E. | No broader automated level is needed. Manual exploration can add varied terms and navigation patterns; lower-level tests help diagnose failures. |
| 6. A tester explores stale input after closing/reopening the modal. | Manual exploratory | Use the running UI, enter values, close through available mechanisms, reopen, and observe fields, errors, loading state, and focus. Record the exact sequence. | This is a method, not another automated pyramid level. Once expected behavior is agreed, component tests provide repeatable coverage and E2E checks parent-state/navigation interactions. |

## 6. Risk Ranking

This provisional ranking prioritises data integrity and blocked workflows over
presentation issues. No usage or failure-frequency data was supplied.

| Rank | Area | What could fail | Who is affected and why impact matters |
| --- | --- | --- | --- |
| 1 | Booking creation | Incorrect desk/date/owner saved; request rejected; an optimistic card remains despite failed persistence. | Booking users and colleagues sharing desks. Incorrect reservations can cause unavailable workspaces and misleading confirmations. |
| 2 | API data loading | Failed requests, unexpected JSON, missing desk relations, or incomplete paginated results. | All dashboard users. They may lose access to reservations or mistake a partial list for the complete inventory. |
| 3 | Modal behaviour | Form cannot open/close, focus becomes inaccessible, pending state never ends, or stale errors block another attempt. | Booking users, especially keyboard and assistive-technology users. A modal failure can prevent the entire creation workflow. |
| 4 | Booking details routing | Navigation targets a missing page or displays the wrong booking. | Users inspecting reservations may make decisions about the wrong record. This is a conditional feature risk because a frontend detail route has not been confirmed. |
| 5 | Dashboard table | Incorrect header/cell mapping, missing rows, or unreadable small-screen content. | Users comparing reservations may misinterpret information, although underlying records may remain intact. The current dashboard uses cards, so table risk applies if that component is used. |

### Strong Assertion for the Highest-Risk Area

> After an authenticated user submits the selected desk and date,
> `POST /bookings` returns HTTP 201; retrieving the returned booking ID through
> `GET /bookings/:id` yields the same desk ID and booking date, with `user_id`
> equal to the authenticated user.

This checks persistence and ownership rather than only optimistic UI feedback.

### Other Observable Evidence

- A network failure produces an alert containing the specified offline message.
- A saved card contains the returned desk name and formatted booking date.
- A successful submission closes the modal.
- Each table cell corresponds to its Desk, Floor, Date, or Status header.
- If a detail page is implemented, its displayed booking identity matches the
  navigation target.
- Rapid local search changes the visible results without issuing new requests.

## 7. Manual Exploratory Testing

Explore modal closing/reopening, keyboard navigation, slow or interrupted
connections, and narrow layouts. Record actions, environment, expected
behavior, observations, and reproducible steps where possible.

Retained input is not automatically a defect. The draft-retention requirement
must establish whether reopening should preserve or clear input.

Exploratory testing is distinct from automated test levels. It can exercise
the whole system without becoming an automated E2E test.

## 8. Assumptions and Missing Requirements

- The baseline is the current implementation, but stakeholder confirmation is
  still needed to establish the intended business behavior.
- Database-backed tests use isolated records, valid test accounts, applied
  migrations, and reliable cleanup.
- Administrator identity and additional permissions are not confirmed. The
  source establishes authenticated users and ownership checks, not an admin role.
- Whether an administrator books for themselves or another colleague is missing;
  the current backend derives the owner from the authenticated token.
- The expected user-facing outcome for an already-booked desk/date is not
  specified. The schema declares uniqueness, but that alone does not specify
  the required API response or message.
- Local-calendar versus UTC date policy needs agreement before timezone-boundary
  behavior can be classified as defective.
- The required draft-retention, modal focus, and success-notification behavior
  needs agreement; current implementation behavior is not automatically a
  requirement.
- A frontend booking detail route has not been confirmed. The existing backend
  lookup does not establish a browser detail page.
- Whether the intended dashboard presents a table or cards remains unconfirmed;
  the current dashboard uses cards.
- Whether the deliberately throwing root handler should become a health check
  is unconfirmed.
- The source declares database constraints, but this review does not establish
  that every deployed database has the matching migrations applied.
- The inspected [frontend package scripts](../package.json) have no test script.
  The [backend test script](../../cospace-backend/backend-api/package.json) is a
  placeholder that exits unsuccessfully. This does not prove that tests cannot
  exist elsewhere or run through another command.

## 9. Strategy Checklist

- [x] Every automated pyramid level has at least one CoSpace example.
- [x] Coverage of the same behavior at multiple levels has a distinct purpose.
- [x] Not every check is an E2E test; lower-level tests cover isolated rules and boundaries.
- [x] Manual exploratory testing remains distinct from automated test levels.
- [x] Assertions use observable evidence rather than "the page looks fine".
- [x] Confirmed source behavior is separated from assumptions and missing requirements.
- [x] No administrator permissions, frontend detail routes, or extra backend validation rules are invented.