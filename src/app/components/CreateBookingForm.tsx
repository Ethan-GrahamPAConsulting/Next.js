"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { NewDeskBooking } from "./RegistrationForm";
import styles from "./RegistrationForm.module.css";

type BookingFormValues = Pick<NewDeskBooking, "desk" | "floor" | "date">;

type CreateBookingFormProps = {
	onCreate: (booking: BookingFormValues) => void;
};

type BookingField = keyof BookingFormValues;
type ValidationErrors = Partial<Record<BookingField, string>>;

export function validateBooking(booking: BookingFormValues): ValidationErrors {
	const errors: ValidationErrors = {};

	if (booking.desk.trim().length < 3) {
		errors.desk = "Desk name must be at least 3 characters long.";
	}

	if (booking.floor.trim().length < 5) {
		errors.floor = "Floor must be at least 5 characters long.";
	}

	const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(booking.date);
	if (!dateParts) {
		errors.date = "Enter a valid date.";
	} else {
		const year = Number(dateParts[1]);
		const month = Number(dateParts[2]);
		const day = Number(dateParts[3]);
		const selectedDate = new Date(year, month - 1, day);
		const isValidDate =
			selectedDate.getFullYear() === year &&
			selectedDate.getMonth() === month - 1 &&
			selectedDate.getDate() === day;

		if (!isValidDate) {
			errors.date = "Enter a valid date.";
		} else {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (selectedDate < today) {
				errors.date = "Date cannot be in the past.";
			}
		}
	}

	return errors;
}

export default function CreateBookingForm({ onCreate }: CreateBookingFormProps) {
	const [desk, setDesk] = useState("");
	const [floor, setFloor] = useState("");
	const [date, setDate] = useState("");
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [isLoading, setIsLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const deskInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isLoading && successMessage) {
			deskInputRef.current?.focus();
		}
	}, [isLoading, successMessage]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isLoading) return;

		const booking = {
			desk: desk.trim(),
			floor: floor.trim(),
			date: date.trim(),
		};
		const nextErrors = validateBooking(booking);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setIsLoading(true);
		setSuccessMessage("");
		try {
			await new Promise<void>((resolve) => setTimeout(resolve, 2000));
			onCreate(booking);
			setDesk("");
			setFloor("");
			setDate("");
			setErrors({});
			setSuccessMessage("Booking created successfully.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<form className={styles.form} noValidate onSubmit={handleSubmit}>
			<label className={styles.field}>
				Desk
				<input
					autoComplete="off"
					ref={deskInputRef}
					aria-describedby={errors.desk ? "desk-error" : undefined}
					aria-invalid={Boolean(errors.desk)}
					className={errors.desk ? styles.invalidInput : undefined}
					onChange={(event) => {
						setDesk(event.currentTarget.value);
						setErrors((current) => ({ ...current, desk: "" }));
						setSuccessMessage("");
					}}
					placeholder="Desk 18"
					type="text"
					disabled={isLoading}
					value={desk}
				/>
				{errors.desk && (
					<span className={styles.errorMessage} id="desk-error" role="alert">
						{errors.desk}
					</span>
				)}
			</label>
			<label className={styles.field}>
				Floor
				<input
					aria-describedby={errors.floor ? "floor-error" : undefined}
					aria-invalid={Boolean(errors.floor)}
					className={errors.floor ? styles.invalidInput : undefined}
					onChange={(event) => {
						setFloor(event.currentTarget.value);
						setErrors((current) => ({ ...current, floor: "" }));
						setSuccessMessage("");
					}}
					placeholder="Floor 2"
					type="text"
					disabled={isLoading}
					value={floor}
				/>
				{errors.floor && (
					<span className={styles.errorMessage} id="floor-error" role="alert">
						{errors.floor}
					</span>
				)}
			</label>
			<label className={styles.field}>
				Date
				<input
					aria-describedby={errors.date ? "date-error" : undefined}
					aria-invalid={Boolean(errors.date)}
					className={errors.date ? styles.invalidInput : undefined}
					onChange={(event) => {
						setDate(event.currentTarget.value);
						setErrors((current) => ({ ...current, date: "" }));
						setSuccessMessage("");
					}}
					disabled={isLoading}
					type="date"
					value={date}
				/>
				{errors.date && (
					<span className={styles.errorMessage} id="date-error" role="alert">
						{errors.date}
					</span>
				)}
			</label>
			<button
				className={styles.submit}
				disabled={isLoading}
				type="submit"
			>
				{isLoading ? "Creating booking..." : "Create booking"}
			</button>
			{successMessage && (
				<p className={styles.successMessage} role="status">
					{successMessage}
				</p>
			)}
		</form>
	);
}
