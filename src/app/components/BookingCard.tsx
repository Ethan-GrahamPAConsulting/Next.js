import Link from 'next/link';
import styles from './BookingCard.module.css';

type BookingCardProps = {
  id: number;
  desk: string;
  floor: string;
  date: string;
  active: boolean;
};

export default function BookingCard({
  id,
  desk,
  floor,
  date,
  active,
}: BookingCardProps) {
  return (
    <Link className={styles.card} href={`/bookings/${id}`}>
      <header className={styles.header}>
        <h2 className={styles.desk}>{desk}</h2>
        <span
          className={`${styles.status} ${active ? styles.active : styles.inactive}`}
        >
          {active ? 'Active' : 'Inactive'}
        </span>
      </header>
      <dl className={styles.details}>
        <div>
          <dt>Floor</dt>
          <dd>{floor}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{date}</dd>
        </div>
      </dl>
    </Link>
  );
}