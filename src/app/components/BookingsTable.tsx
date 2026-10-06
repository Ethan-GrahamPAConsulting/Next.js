export type BookingTableRow = {
  id: number;
  desk: string;
  floor: string;
  date: string;
  status: "Active" | "Inactive";
};

const mockBookings: BookingTableRow[] = [
  { id: 1, desk: "Desk 04", floor: "Floor 2", date: "October 2, 2026", status: "Active" },
  {
    id: 2,
    desk: "Window Desk 12",
    floor: "Floor 3",
    date: "October 5, 2026",
    status: "Inactive",
  },
  {
    id: 3,
    desk: "Collaboration Desk 07",
    floor: "Floor 1",
    date: "October 8, 2026",
    status: "Active",
  },
];

export default function BookingsTable({
  bookings = mockBookings,
}: {
  bookings?: BookingTableRow[];
}) {
  return (
    <table>
      <caption>Desk bookings</caption>
      <thead>
        <tr>
          <th scope="col">Desk</th>
          <th scope="col">Floor</th>
          <th scope="col">Date</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id}>
            <td>{booking.desk}</td>
            <td>{booking.floor}</td>
            <td>{booking.date}</td>
            <td>
              <span data-status={booking.status.toLowerCase()}>{booking.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}