import styles from './BookingCard.module.css';

type BookingCardProps = {
  desk: string;
  floor: string;
  date: string;
  active: boolean;
};

export default function BookingCard({
  desk,
  floor,
  date,
  active,
}: BookingCardProps) {
  return (
    <article className={styles.card}>
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
    </article>
  );
}