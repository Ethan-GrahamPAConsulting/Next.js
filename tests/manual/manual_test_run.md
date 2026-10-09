# CoSpace Manual Test Run

**Date**: 2026-10-08
**Environment**: macOS; VS Code integrated browser (browser build not exposed); Next.js 16.3.8 frontend at `http://localhost:3000`; Express API at `http://localhost:5000`.
**Data safety**: The API reported 9 bookings before and after the run. No booking was written to MySQL. Login and create responses used in UI checks were intercepted browser responses, not real credentials or a database write.
**Scope**: Browser-assisted manual checks and read-only API requests. This is not a completed isolated-database E2E run.

## Source Observations

- The dashboard uses `RegistrationForm`, not the standalone `CreateBookingForm`.
- Dashboard form controls are labeled **Desk** and **Date**; its submit button says **Add booking**. There is no floor or contact-email input. Floor is derived from the selected desk.
- Desk selection is required. Date is required and its observed minimum was `2026-10-09`. The dashboard date input has no past-date application error text; the browser enforces its `min` constraint.
- A user must sign in before the dashboard opens the create form. The form disables fields while submitting, posts the selected desk/date through the parent callback, clears fields after callback success, and closes the modal.
- Search filters loaded booking cards in the browser. It trims and lowercases the query; no matching results render `No bookings match “<query>”.` Clearing search restores loaded cards.
- The API returns paginated bookings. During this run, GET `/bookings` returned 9 records. A direct request for `/bookings/1` returned HTTP 200 and fields `id`, `user_id`, `desk_id`, `booking_date`, and `active`; `/bookings/99999999` returned HTTP 404 with `{"error":"Booking not found"}`.
- There is no frontend `/bookings/[id]` route in the inspected source.

## Task 1: Testing Model

- **Shift-left**: check validation and request rules at the unit/schema boundary, then form interactions, API/database integration, and finally a smaller number of browser journeys.
- **BDD**: use Given-When-Then to express shared behavior, such as “given loaded bookings, when the user searches for a desk, then only matching cards are shown.”
- **Testing Pyramid**: keep many fast unit checks, a useful set of component/integration checks, and fewer E2E checks. E2E depends on more services and data and is slower to diagnose; it should verify a full user journey, not every boundary value.

### Confirmed Requirements

- Search matches desk, floor, formatted date, and active/inactive status among bookings already loaded in the dashboard.
- Dashboard booking requires an existing desk selection and a date value; the browser date input has a runtime `min` value.
- POST `/bookings` is authenticated and schema-validated. Backend create schema requires positive integer `desk_id`, coerces `booking_date` to a date, and permits optional boolean `active`.
- Successful backend create returns HTTP 201; backend does not accept `user_id` from the client.
- The backend API supports `GET /bookings/:id`, returning 200 for an existing record and 404 with `Booking not found` for an unknown ID.

### Product Questions / Unsupported Requirements

- Whether there should be a **frontend** booking detail page at `/bookings/[id]`; none exists in the inspected app.
- Whether booking should accept or validate floor independently; dashboard derives it from the selected desk.
- Whether email is a booking field; the booking form has no email field. Email only appears in the separate sign-in form.
- Whether booking date may be in the past at the backend; the backend schema does not prohibit it, although the dashboard date input has a `min`.
- Expected message and behavior for an invalid or duplicate booking response.
- Whether closing/reopening the modal should retain the selected desk/date.

## Task 2: Manual Scenarios

The Gherkin draft is in [bookings.feature](bookings.feature). Its search, form, and API-route assumptions were checked against the source. The `/bookings/:id` scenario is an API check, not a frontend navigation scenario.

| Case | Steps / data | Actual observation | Result |
|---|---|---|---|
| Search match | Search for `Desk-01`. | 3 loaded cards matched. | Pass |
| Search no-match with whitespace | Search for `   no-match-cospace   `. | 0 cards; status text was `No bookings match “no-match-cospace”.` | Pass |
| Clear search | Clear the search field after no-match. | 9 live API cards returned. | Pass |
| Very long input | Search for 500 consecutive `x` characters. | No-match message rendered; body measured `scrollWidth=3537px` against `clientWidth=672px`; message measured `scrollWidth=3513px` against `clientWidth=624px`. | Candidate layout issue; see BUG-001. |
| Blank booking fields | With login intercepted for UI access, click **Add booking** while Desk and Date are empty. | Both controls reported native `validity.valueMissing=true`; intercepted create POST count stayed 0. | Pass (UI-only; not a real authenticated session) |
| Past date | In the same UI-only session, choose a desk and set date to `2026-10-08`, one day below observed `min=2026-10-09`; submit. | `validity.rangeUnderflow=true`; intercepted create POST count stayed 0. | Pass (browser constraint only) |
| Invalid email | In sign-in dialog enter `not-an-email` and a non-empty password, then submit. | Email control reported `validity.typeMismatch=true`; intercepted login request count stayed 0. This is the sign-in email, not a booking contact-email field. | Pass (native browser validation) |
| Keyboard submit | With login and POST intercepted, select desk 1, use the date minimum, focus **Add booking**, and press Enter. | One intercepted POST carried `{ desk_id: 1, booking_date: "2026-10-09", active: true }`; mock response produced a card and closed modal. | UI-only pass; not persisted |
| Existing booking API ID | GET `/bookings/1`. | HTTP 200; response contained booking fields. | Pass (read-only API) |
| Unknown booking API ID | GET `/bookings/99999999`. | HTTP 404 with `{"error":"Booking not found"}`. | Pass (read-only API) |
| Unknown frontend URL | Navigate browser to `/bookings/99999999`. | Next.js generic 404 page, not a booking detail view. | Observed; whether this is a defect depends on product decision. |

### Unrun / Inconclusive

- **Live booking creation and persistence**: not run. There is no confirmed test account or isolated test-database/cleanup procedure; UI create checks used mocked login and POST responses to avoid writing to the configured database.
- **Floor validation**: not applicable to the current dashboard form; it has no floor input. The separate `CreateBookingForm` is not mounted by the dashboard.
- **Repeat submit**: rapid double-click check was inconclusive. The browser check timed out waiting for its mock response card, and the snapshot did not establish whether the mocked request was submitted. No failure is claimed.
- **Reopen modal**: after selecting desk 1 and date `2026-10-09`, closing and reopening the modal showed the same selection/date. Whether this is correct is an open product question.
- **Navigation away/refresh after a real successful booking**: not run; the mocked UI booking is not persistence evidence.
- **Timed exploratory charter**: a 10-minute timer/session was not run. The available tools did not provide a timer, and no real test credentials or isolated database were available. The partial observations above are not represented as a completed 10-minute exploratory session.

## Task 3: Risk and Test Design

### Provisional Risk Order

| Rank | Area | Failure impact |
|---|---|---|
| 1 | Booking creation | Wrong or unpersisted reservation misleads users and can make a desk unavailable. |
| 2 | API data loading | Users may see no bookings or mistake one paginated page for the entire inventory. |
| 3 | Modal behavior | Inability to open, close, or recover from the form blocks creation. |
| 4 | Booking details | Unknown frontend route; if required, users cannot inspect a booking. |
| 5 | Dashboard table | Current dashboard displays cards, not the standalone `BookingsTable`; risk applies if table view is intended. |

### Boundary Value Analysis

- Dashboard date: test one day below the runtime `min`, the `min` day, and one day above it. The below-minimum value was checked; equality (`2026-10-09`) was used in the mocked keyboard submit; the next-day boundary was not separately recorded.
- Desk input: dashboard has a required select, not free text, so desk-name length boundaries do not apply to this form.
- Backend `desk_id`: schema requires a positive integer. Suggested schema cases are 0, 1, and 2, distinguishing schema acceptance from whether a referenced desk exists; not executed in this manual run.
- Floor length boundaries from `CreateBookingForm` are not dashboard requirements and were not applied here.

### Equivalence Partitioning

- Desk selection: no selection / existing desk. No-selection browser validation was checked; valid desk was used in mocked UI submission.
- Date: before min / at min / after min. Before-min was blocked; at-min was used for mocked submission; after-min not separately checked.
- Login email: malformed / browser-valid syntax. Malformed input was blocked before request; valid syntax was used with an intercepted login, not a real credential.
- Booking lookup: existing ID / unknown ID. Both API classes were checked read-only.

### Decision Table

| Desk selected | Date at/after min | Expected submission | Run evidence |
|---|---|---|---|
| No | No | Browser blocks required controls | Checked: both fields invalid, no POST |
| No | Yes | Browser blocks Desk | Not separately checked |
| Yes | No | Browser blocks Date | Checked: range underflow, no POST |
| Yes | Yes | Form invokes create callback | Checked only with intercepted login/POST; persistence unverified |

### Regression Pass After Search-Message Change

The search empty-state message was changed to echo `searchTerm.trim()`.

- **Repeated happy path for changed feature**: `Desk-01` search showed 3 cards. Pass.
- **Repeated no-result/clear behavior**: whitespace-padded no-match showed the trimmed term; clearing restored 9 cards. Pass.
- **Related validation check**: below-minimum date remained browser-invalid and caused no intercepted POST. Pass.
- **Booking-creation happy path**: a mocked UI submission appeared as a card and closed the modal, but a real API/database round trip was not verified. This is not a full persistence regression pass.

## Exploratory Observations

Partial, browser-assisted exploratory actions:

1. Opened sign-in; invalid email was blocked by native email validation before any login request.
2. Used an intercepted login to reach the booking modal, selected a desk/date, closed it, and reopened it; the selection/date were retained.
3. Tried a rapid double-click with an intercepted create response; outcome was inconclusive due to the browser check timing out.
4. Reloaded the dashboard to discard local mocked state; the API again returned the original 9 records.

These actions do not constitute the requested timed 10-minute session. Revisit interrupted requests, retries, navigation-away, and reload after a genuinely persisted booking in an isolated test environment.

## BUG-001: Long Unmatched Search Text Expands the No-Results Message

**Status**: Candidate issue; confirm the expected long-query behavior with product.
**Severity**: Low
**Priority**: P3
**Environment**: macOS; VS Code integrated browser (exact engine/version not exposed); Next.js 16.3.8 local development; measured viewport client width 672px.

**Preconditions**:
The dashboard has loaded bookings and the search field is available.

**Steps to Reproduce**:
1. Enter 500 consecutive `x` characters into **Search bookings**.
2. Observe the no-results status and page/container widths.

**Expected Result**:
No explicit maximum search length or overflow rule is documented. If long input is supported, product should decide whether the status message wraps within the dashboard viewport or whether input length is limited with an agreed message.

**Actual Result**:
The status includes the full 500-character query. Its content width measured 3513px in a 624px container; document `scrollWidth` measured 3537px while `clientWidth` was 672px. This creates horizontal overflow/clipping.

**Suggested Fix**:
If long search input remains supported, apply a wrapping rule such as `overflow-wrap: anywhere` to the empty-state message. Alternatively, define an approved input-length limit and user-facing behavior.

## Outstanding Product Decisions

- Is `/bookings/[id]` intended as a frontend route, or is only the API lookup required?
- Should the modal preserve desk/date values after close/reopen?
- Is there an approved test account and isolated MySQL database for a real create/persistence check?
- What maximum search length and long-query presentation are expected?
- Is a booking contact email or independent floor field required? Neither exists in the current dashboard form.
