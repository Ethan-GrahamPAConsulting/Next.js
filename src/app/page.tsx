"use client";

import api, { isAxiosError } from "@/lib/api";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import BaseModal from "./components/BaseModal";
import BookingCard from "./components/BookingCard";
import LoginForm, { type LoginCredentials } from "./components/LoginForm";
import RegistrationForm, {
  type DeskOption,
  type NewDeskBooking,
} from "./components/RegistrationForm";

interface ColleagueOpportunity {
  id: number;
  user_id: number;
  desk_id: number;
  booking_date: string;
  active: boolean;
  desk: {
    name: string;
    floor: number;
  };
}

interface BookingsResponse {
  data: ColleagueOpportunity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type AuthResponse = {
  token: string;
  user: { id: number };
};

function requestErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error) && !error.response) {
    return "The database server is currently offline. Please check your connection.";
  }
  return fallback;
}

function formatBookingDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<ColleagueOpportunity[]>([]);
  const [desks, setDesks] = useState<DeskOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBookings() {
      try {
        const [bookingsResponse, desksResponse] = await Promise.all([
          api.get<BookingsResponse>("/bookings", {
            signal: controller.signal,
          }),
          api.get<DeskOption[]>("/desks", { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;

        const result = bookingsResponse.data;
        const deskOptions = desksResponse.data;
        setDesks(deskOptions);
        setBookings(result.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          requestErrorMessage(error, "Unable to load bookings. Please try again."),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadBookings();
    return () => controller.abort();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleBookings = bookings.filter((booking) =>
    [
      booking.desk.name,
      `Floor ${booking.desk.floor}`,
      formatBookingDate(booking.booking_date),
      booking.active ? "active" : "inactive",
    ].some((value) => value.toLowerCase().includes(normalizedSearch)),
  );

  async function handleLogin(credentials: LoginCredentials) {
    try {
      const response = await api.post<AuthResponse>(
        "/auth/login",
        credentials,
      );
      setAuthToken(response.data.token);
      setUserId(response.data.user.id);
      setIsLoginModalOpen(false);
      setIsModalOpen(true);
    } catch (error: unknown) {
      throw new Error(
        requestErrorMessage(error, "Unable to sign in. Check your email and password."),
      );
    }
  }

  async function handleRegister(booking: NewDeskBooking) {
    if (!authToken || userId === null) {
      throw new Error("Please sign in before creating a booking.");
    }
    const optimisticId = -Date.now();
    const selectedDesk = desks.find((desk) => desk.id === booking.deskId);
    if (!selectedDesk) throw new Error("Please select an existing desk.");

    const optimisticBooking: ColleagueOpportunity = {
      id: optimisticId,
      user_id: userId,
      desk_id: selectedDesk.id,
      desk: { name: selectedDesk.name, floor: selectedDesk.floor },
      booking_date: `${booking.date}T00:00:00Z`,
      active: true,
    };

    setBookings((currentBookings) => [...currentBookings, optimisticBooking]);
    try {
      const response = await api.post<ColleagueOpportunity>(
        "/bookings",
        {
          desk_id: booking.deskId,
          booking_date: booking.date,
          active: true,
        },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      const savedBooking = response.data;
      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.id === optimisticId
            ? savedBooking
            : currentBooking,
        ),
      );
    } catch (error) {
      setBookings((currentBookings) =>
        currentBookings.filter((currentBooking) => currentBooking.id !== optimisticId),
      );
      throw new Error(
        requestErrorMessage(error, "Unable to save this booking. Please try again."),
      );
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="#overview">
          <span className={styles.brandMark} aria-hidden="true">
            C
          </span>
          <span className={styles.brandCopy}>
            <strong>CoSpace</strong>
            <small>WORKSPACE</small>
          </span>
        </a>
        <nav className={styles.navigation} aria-label="Main navigation">
          <a className={styles.navLink} href="#overview">
            Overview
          </a>
          <a
            className={styles.navLink}
            href="#bookings"
            aria-current="page"
          >
            Bookings
          </a>
        </nav>
        <p className={styles.sidebarFooter}>Your place to get things done.</p>
      </aside>

      <main className={styles.main} id="overview">
        <div className={styles.dashboard}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>WORKSPACE / BOOKINGS</p>
              <h1>Desk bookings</h1>
              <p className={styles.subtitle}>Your workspace reservations</p>
            </div>
            <div className={styles.headerActions}>
              {authToken && (
                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    setAuthToken("");
                    setUserId(null);
                  }}
                  type="button"
                >
                  Sign out
                </button>
              )}
              <button
                className={styles.primaryButton}
                onClick={() =>
                  authToken
                    ? setIsModalOpen(true)
                    : setIsLoginModalOpen(true)
                }
                type="button"
              >
                {authToken ? "New booking" : "Sign in to book"}
              </button>
            </div>
          </header>

          <section
            className={styles.bookingSection}
            id="bookings"
            aria-labelledby="bookings-heading"
          >
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="bookings-heading">All bookings</h2>
                <p>
                  {isLoading ? "Loading..." : `${visibleBookings.length} reservations`}
                </p>
              </div>
              <label className={styles.searchLabel}>
                <span>Search bookings</span>
                <input
                  className={styles.searchInput}
                  type="search"
                  placeholder="Desk, floor, date, or status"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.currentTarget.value)
                  }
                />
              </label>
            </div>
            {isLoading ? (
              <p className={styles.emptyState} role="status">
                Loading...
              </p>
            ) : loadError ? (
              <p className={styles.errorAlert} role="alert">
                {loadError}
              </p>
            ) : visibleBookings.length > 0 ? (
              <div className={styles.bookingList}>
                {visibleBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    desk={booking.desk.name}
                    floor={`Floor ${booking.desk.floor}`}
                    date={formatBookingDate(booking.booking_date)}
                    active={booking.active}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.emptyState} role="status">
                {searchTerm
                  ? `No bookings match “${searchTerm}”.`
                  : "No bookings yet."}
              </p>
            )}
          </section>
        </div>
      </main>
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add a desk booking"
      >
        <RegistrationForm
          desks={desks}
          onRegister={handleRegister}
          onRegistered={() => setIsModalOpen(false)}
        />
      </BaseModal>
      <BaseModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Sign in to CoSpace"
      >
        <LoginForm onLogin={handleLogin} />
      </BaseModal>
    </div>
  );
}
