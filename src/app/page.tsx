"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Game from "./components/Game";
import BookingCard from "./components/BookingCard";
import RegistrationForm, {
  type NewDeskBooking,
} from "./components/RegistrationForm";

type DeskBooking = NewDeskBooking & {
  id: number;
  active: boolean;
};

export default function Home() {
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
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>COSPACE / BOOKINGS</p>
          <h1>Desk bookings</h1>
          <p className={styles.subtitle}>Your workspace reservations</p>
        </header>
        <RegistrationForm onRegister={handleRegister} />
        <label className={styles.searchLabel}>
          Search bookings
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by desk, floor, date, or status"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
        </label>
        <section className={styles.bookingList} aria-label="Desk bookings">
          {visibleBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              id={booking.id}
              desk={booking.desk}
              floor={booking.floor}
              date={booking.date}
              active={booking.active}
            />
          ))}
        </section>
        {visibleBookings.length === 0 && (
          <p className={styles.emptyState} role="status">
            No bookings match “{searchTerm}”.
          </p>
        )}
        <br />
                
        <Game />
      </main>
    </div>
  );
}
