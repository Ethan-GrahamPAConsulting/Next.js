import Link from "next/link";
import styles from "./page.module.css";

const bookings = [
	{
		id: "1",
		desk: "Desk 04",
		floor: "Floor 2",
		date: "October 2, 2026",
		active: true,
	},
	{
		id: "2",
		desk: "Window Desk 12",
		floor: "Floor 3",
		date: "October 5, 2026",
		active: false,
	},
	{
		id: "3",
		desk: "Collaboration Desk 07",
		floor: "Floor 1",
		date: "October 8, 2026",
		active: true,
	},
];

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function BookingPage({ params }: PageProps) {
	const { id } = await params;
	const booking = bookings.find((item) => item.id === id);

	if (!booking) {
		return (
			<main className={styles.page}>
				<div className={styles.content}>
					<article className={styles.details}>
						<header className={styles.header}>
							<div>
								<p className={styles.eyebrow}>BOOKING UNAVAILABLE</p>
								<h1>Booking not found</h1>
							</div>
						</header>
						<p className={styles.message}>
							This desk booking does not exist or has been removed.
						</p>
						<Link className={styles.fallbackLink} href="/">
							Return to the home page
						</Link>
					</article>
				</div>
			</main>
		);
	}

	return (
		<main className={styles.page}>
			<div className={styles.content}>
				<Link className={styles.backLink} href="/">
					Back to bookings
				</Link>
				<article className={styles.details}>
					<header className={styles.header}>
						<div>
							<p className={styles.eyebrow}>BOOKING #{booking.id}</p>
							<h1>{booking.desk}</h1>
						</div>
						<span
							className={`${styles.status} ${booking.active ? styles.active : styles.inactive}`}
						>
							{booking.active ? "Active" : "Inactive"}
						</span>
					</header>
					<dl className={styles.fields}>
						<div>
							<dt>Floor</dt>
							<dd>{booking.floor}</dd>
						</div>
						<div>
							<dt>Date</dt>
							<dd>{booking.date}</dd>
						</div>
					</dl>
				</article>
			</div>
		</main>
	);
}
