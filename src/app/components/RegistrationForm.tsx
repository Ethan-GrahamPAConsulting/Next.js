import { useState, type FormEvent } from "react";
import styles from "./RegistrationForm.module.css";

export type DeskOption = {
  id: number;
  name: string;
  floor: number;
};

export type NewDeskBooking = {
  deskId: number;
  desk: string;
  floor: string;
  date: string;
};

type RegistrationFormProps = {
  desks: DeskOption[];
  onRegister: (booking: NewDeskBooking) => Promise<void>;
  onRegistered: () => void;
};

export default function RegistrationForm({
  desks,
  onRegister,
  onRegistered,
}: RegistrationFormProps) {
  const [deskId, setDeskId] = useState("");
  const [date, setDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const selectedDesk = desks.find((desk) => desk.id === Number(deskId));
    if (!selectedDesk) {
      setSubmitError("Select a desk to continue.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onRegister({
        deskId: selectedDesk.id,
        desk: selectedDesk.name,
        floor: `Floor ${selectedDesk.floor}`,
        date,
      });
      setDeskId("");
      setDate("");
      onRegistered();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to create booking.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        Desk
        <select
          disabled={isSubmitting}
          onChange={(event) => setDeskId(event.currentTarget.value)}
          required
          value={deskId}
        >
          <option value="">Choose a desk</option>
          {desks.map((desk) => (
            <option key={desk.id} value={desk.id}>
              {desk.name} · Floor {desk.floor}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Date
        <input
          disabled={isSubmitting}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => setDate(event.currentTarget.value)}
          required
          type="date"
          value={date}
        />
      </label>
      {submitError && (
        <p className={styles.errorMessage} role="alert">
          {submitError}
        </p>
      )}
      <button className={styles.submit} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving booking..." : "Add booking"}
      </button>
    </form>
  );
}