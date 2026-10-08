@manual
Feature: CoSpace desk bookings
  Manual scenarios based on the current dashboard and booking API source.

  # The dashboard uses RegistrationForm. It has Desk and Date controls; Floor is
  # derived from the selected desk, not entered or independently validated.
  # CreateBookingForm has separate validation but is not rendered by the dashboard.
  # There is no frontend /bookings/[id] page. The route scenario below covers
  # the confirmed Express API endpoint GET /bookings/:id.

  Scenario: Find a loaded booking by desk name
    Given the dashboard has loaded a booking for desk "Desk Alpha"
    And the dashboard has loaded a booking for desk "Desk Beta"
    When I enter "Desk Alpha" in the "Search bookings" field
    Then the card for "Desk Alpha" is visible
    And the card for "Desk Beta" is not visible

  Scenario: Create a valid booking
    Given I am signed in with a valid test account
    And an existing desk named "Desk Alpha" is available
    And fewer than 10 bookings currently occupy the first bookings page
    And the test date "2026-10-12" is not earlier than the Date field's minimum
    When I open the booking form
    And I select "Desk Alpha · Floor 1" from the "Desk" field
    And I enter "2026-10-12" in the "Date" field
    And I submit with "Add booking"
    Then a card for "Desk Alpha" on "October 12, 2026" is visible
    And the booking is returned successfully by the API
    And the booking remains available after reloading the dashboard

  Scenario: Prevent submission of a date earlier than the allowed minimum
    Given I am signed in with a valid test account
    And an existing desk is available
    And I open the booking form
    When I select an existing desk from the "Desk" field
    And I enter a date earlier than the "Date" field's minimum
    And I submit with "Add booking"
    Then the browser prevents the form submission
    And no booking for that attempt appears in the dashboard

  @api
  Scenario Outline: Look up an existing or unknown booking ID
    Given the test database <recordState> booking ID "<id>"
    When I send GET "/bookings/<id>"
    Then the API responds with HTTP <status>
    And the response contains <evidence>

    Examples:
      | recordState | id    | status | evidence                                      |
      | contains    | 21001 | 200    | a booking object with id 21001                |
      | lacks       | 99999 | 404    | JSON error "Booking not found"               |
