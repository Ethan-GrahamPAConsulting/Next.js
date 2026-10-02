import { useState, type FormEvent } from "react";
import styles from "./RegistrationForm.module.css";

export type NewDeskBooking = {
  desk: string;
  floor: string;
  date: string;
};

type RegistrationFormProps = {
  onRegister: (booking: NewDeskBooking) => void;
};

export default function RegistrationForm({ onRegister }: RegistrationFormProps) {
  const [desk, setDesk] = useState("");
  const [floor, setFloor] = useState("");
  const [date, setDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRegister({
      desk: desk.trim(),
      floor: floor.trim(),
      date: date.trim(),
    });
    setDesk("");
    setFloor("");
    setDate("");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        Desk
        <input
          autoComplete="off"
          onChange={(event) => setDesk(event.currentTarget.value)}
          placeholder="Desk 18"
          required
          type="text"
          value={desk}
        />
      </label>
      <label className={styles.field}>
        Floor
        <input
          onChange={(event) => setFloor(event.currentTarget.value)}
          placeholder="Floor 2"
          required
          type="text"
          value={floor}
        />
      </label>
      <label className={styles.field}>
        Date
        <input
          onChange={(event) => setDate(event.currentTarget.value)}
          placeholder="October 12, 2026"
          required
          type="text"
          value={date}
        />
      </label>
      <button className={styles.submit} type="submit">
        Add booking
      </button>
    </form>
  );
}