import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCalendarAlt, FaMapMarkerAlt, FaPhoneAlt, FaUser } from "react-icons/fa";
import { getBeauticianBookings, updateBookingStatus } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import { formatPrice, formatTime12, formatDateLong } from "../services/format";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import PaymentSection from "../components/PaymentSection";

const sortKey = (b) => `${b.date} ${b.startTime}`;

// Has the appointment time arrived? (India time)
const hasStarted = (b) => Date.now() >= new Date(`${b.date}T${b.startTime}:00+05:30`).getTime();

export default function BeauticianBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("requests");
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState(null); // { booking, status }
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getBeauticianBookings();
      setBookings(data.bookings);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (booking, status, message) => {
    setBusyId(booking._id);
    setModalError("");
    try {
      await updateBookingStatus(booking._id, status);
      toast.success(message);
      setConfirm(null);
      await load();
    } catch (err) {
      const text = getErrorMessage(err);
      if (confirm) setModalError(text);
      else toast.error(text);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <Loader text="Loading your bookings..." />;

  const requests = bookings
    .filter((b) => b.status === "Pending")
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const upcoming = bookings
    .filter((b) => b.status === "Accepted")
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const past = bookings
    .filter((b) => ["Completed", "Rejected", "Cancelled"].includes(b.status))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

  const completed = bookings.filter((b) => b.status === "Completed");
  const earned = completed.reduce((sum, b) => sum + b.price, 0);

  const lists = { requests, upcoming, past };
  const shown = lists[tab];

  const emptyText = {
    requests: ["No new requests", "New booking requests from customers will show up here."],
    upcoming: ["No upcoming appointments", "Appointments you accept will show up here."],
    past: ["No past bookings", "Completed, rejected and cancelled bookings will show up here."],
  }[tab];

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{requests.length}</div>
          <div className="stat-label">New requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{upcoming.length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{completed.length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{formatPrice(earned)}</div>
          <div className="stat-label">Value of completed</div>
        </div>
      </div>

      <div className="tabs">
        <button type="button" className={tab === "requests" ? "tab active" : "tab"} onClick={() => setTab("requests")}>
          New requests ({requests.length})
        </button>
        <button type="button" className={tab === "upcoming" ? "tab active" : "tab"} onClick={() => setTab("upcoming")}>
          Upcoming ({upcoming.length})
        </button>
        <button type="button" className={tab === "past" ? "tab active" : "tab"} onClick={() => setTab("past")}>
          Past ({past.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state">
          <h3>{emptyText[0]}</h3>
          <p>{emptyText[1]}</p>
        </div>
      ) : (
        shown.map((b) => (
          <div key={b._id} className="booking-card">
            <div className="booking-top">
              <div>
                <h3>{b.serviceTitle}</h3>
                <span className="text-muted small">
                  {b.durationMinutes} min · {formatPrice(b.price)}
                </span>
              </div>
              <StatusBadge status={b.status} />
            </div>

            <div className="booking-info">
              <span>
                <FaUser />
                <span>{b.customer?.name || "Customer"}</span>
              </span>
              <span>
                <FaCalendarAlt />
                <span>
                  {formatDateLong(b.date)}
                  <br />
                  {formatTime12(b.startTime)} to {formatTime12(b.endTime)}
                </span>
              </span>
              <span>
                <FaMapMarkerAlt />
                <span>
                  {b.address.street}, {b.address.city} - {b.address.pincode}
                </span>
              </span>
              {b.status === "Accepted" && b.customer?.phone && (
                <span>
                  <FaPhoneAlt />
                  <span>Customer: {b.customer.phone}</span>
                </span>
              )}
            </div>

            {b.notes && <p className="booking-note">Customer note: {b.notes}</p>}

              <PaymentSection booking={b} role="beautician" onChanged={load} />

            {b.status === "Pending" && (
              <div className="booking-foot">
                <span className="text-muted small">Please respond to this request.</span>
                <div className="booking-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setModalError("");
                      setConfirm({ booking: b, status: "Rejected" });
                    }}
                    disabled={busyId === b._id}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => changeStatus(b, "Accepted", "Booking accepted")}
                    disabled={busyId === b._id}
                  >
                    {busyId === b._id ? "Saving..." : "Accept"}
                  </button>
                </div>
              </div>
            )}

            {b.status === "Accepted" && (
              <div className="booking-foot">
                {hasStarted(b) ? (
                  <span className="text-muted small">The appointment time has arrived.</span>
                ) : (
                  <span className="text-muted small">You can mark it completed once the appointment starts.</span>
                )}
                <div className="booking-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setModalError("");
                      setConfirm({ booking: b, status: "Cancelled" });
                    }}
                    disabled={busyId === b._id}
                  >
                    Cancel
                  </button>
                  {hasStarted(b) && (
                    <button
                      type="button"
                      className="btn btn-plum btn-sm"
                      onClick={() => changeStatus(b, "Completed", "Appointment marked as completed")}
                      disabled={busyId === b._id}
                    >
                      {busyId === b._id ? "Saving..." : "Mark completed"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {confirm && (
        <Modal
          title={confirm.status === "Rejected" ? "Reject this request?" : "Cancel this appointment?"}
          onClose={() => setConfirm(null)}
        >
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <p>
            <strong>{confirm.booking.serviceTitle}</strong> for {confirm.booking.customer?.name || "the customer"}
            <br />
            {formatDateLong(confirm.booking.date)}, {formatTime12(confirm.booking.startTime)}
          </p>
          <p className="text-muted small">
            The customer will see this change in their dashboard, and the time becomes free again.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirm(null)}>
              Go back
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={busyId === confirm.booking._id}
              onClick={() =>
                changeStatus(
                  confirm.booking,
                  confirm.status,
                  confirm.status === "Rejected" ? "Request rejected" : "Appointment cancelled"
                )
              }
            >
              {busyId === confirm.booking._id
                ? "Saving..."
                : confirm.status === "Rejected"
                ? "Yes, reject"
                : "Yes, cancel"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}