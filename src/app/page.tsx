"use client";

import { useState } from "react";
import styles from "./page.module.css";
import BaseModal from "./components/BaseModal";
import BookingsTable, {
  type BookingTableRow,
} from "./components/BookingsTable";
import RegistrationForm, {
  type NewDeskBooking,
} from "./components/RegistrationForm";

type DeskBooking = NewDeskBooking & {
  id: number;
  active: boolean;
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState<DeskBooking[]>([
    {
      id: 1,
      desk: "Desk 04",
      floor: "Floor 2",
      date: "October 2, 2026",
      active: true,
    },
    {
      id: 2,
      desk: "Window Desk 12",
      floor: "Floor 3",
      date: "October 5, 2026",
      active: false,
    },
    {
      id: 3,
      desk: "Collaboration Desk 07",
      floor: "Floor 1",
      date: "October 8, 2026",
      active: true,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleBookings = bookings.filter((booking) =>
    [
      booking.desk,
      booking.floor,
      booking.date,
      booking.active ? "active" : "inactive",
    ].some((value) => value.toLowerCase().includes(normalizedSearch)),
  );
  const visibleBookingRows: BookingTableRow[] = visibleBookings.map(
    (booking) => ({
      id: booking.id,
      desk: booking.desk,
      floor: booking.floor,
      date: booking.date,
      status: booking.active ? "Active" : "Inactive",
    }),
  );

  function handleRegister(booking: NewDeskBooking) {
    setBookings((currentBookings) => [
      ...currentBookings,
      {
        ...booking,
        id: currentBookings.reduce(
          (highestId, currentBooking) => Math.max(highestId, currentBooking.id),
          0,
        ) + 1,
        active: true,
      },
    ]);
    setIsModalOpen(false);
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
            <button
              className={styles.primaryButton}
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              New booking
            </button>
          </header>

          <section
            className={styles.bookingSection}
            id="bookings"
            aria-labelledby="bookings-heading"
          >
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="bookings-heading">All bookings</h2>
                <p>{visibleBookings.length} reservations</p>
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
            <div className={styles.tableFrame}>
              <BookingsTable bookings={visibleBookingRows} />
            </div>
            {visibleBookings.length === 0 && (
              <p className={styles.emptyState} role="status">
                No bookings match “{searchTerm}”.
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
        <RegistrationForm onRegister={handleRegister} />
      </BaseModal>
    </div>
  );
}
