import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCalendarAlt, FaMapMarkerAlt, FaPhoneAlt, FaStar, FaRegStar } from "react-icons/fa";
import { getMyBookings, updateBookingStatus } from "../services/bookingService";
import { createReview } from "../services/reviewService";
import { getErrorMessage } from "../services/api";
import { formatPrice, formatTime12, formatDateLong } from "../services/format";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import PaymentSection from "../components/PaymentSection";

const ACTIVE = ["Pending", "Accepted"];
const sortKey = (b) => `${b.date} ${b.startTime}`;

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("upcoming");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyBookings();
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

  const closeModals = () => {
    setCancelTarget(null);
    setReviewTarget(null);
    setRating(0);
    setComment("");
    setModalError("");
  };

  const confirmCancel = async () => {
    setBusy(true);
    setModalError("");
    try {
      await updateBookingStatus(cancelTarget._id, "Cancelled");
      toast.success("Booking cancelled");
      closeModals();
      await load();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating) {
      setModalError("Please choose a star rating");
      return;
    }
    if (comment.length > 500) {
      setModalError("Your comment cannot be more than 500 characters");
      return;
    }

    setBusy(true);
    setModalError("");
    try {
      await createReview({
        bookingId: reviewTarget._id,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Thank you for your review!");
      closeModals();
      await load();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader text="Loading your bookings..." />;

  const upcoming = bookings
    .filter((b) => ACTIVE.includes(b.status))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const previous = bookings
    .filter((b) => !ACTIVE.includes(b.status))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  const shown = tab === "upcoming" ? upcoming : previous;

  const count = (status) => bookings.filter((b) => b.status === status).length;

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{count("Pending")}</div>
          <div className="stat-label">Waiting for approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{count("Accepted")}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{count("Completed")}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{bookings.length}</div>
          <div className="stat-label">All bookings</div>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={tab === "upcoming" ? "tab active" : "tab"}
          onClick={() => setTab("upcoming")}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          type="button"
          className={tab === "previous" ? "tab active" : "tab"}
          onClick={() => setTab("previous")}
        >
          Previous ({previous.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state">
          <h3>{tab === "upcoming" ? "No upcoming bookings" : "No previous bookings"}</h3>
          <p>
            {tab === "upcoming"
              ? "When you book a service, it will show up here."
              : "Completed, cancelled and rejected bookings will show up here."}
          </p>
          {tab === "upcoming" && (
            <Link to="/services" className="btn btn-primary btn-sm">
              Browse services
            </Link>
          )}
        </div>
      ) : (
        shown.map((b) => (
          <div key={b._id} className="booking-card">
            <div className="booking-top">
              <div>
                <h3>{b.serviceTitle}</h3>
                {b.beautician && (
                  <span className="text-muted small">
                    with <Link to={`/beauticians/${b.beautician._id}`}>{b.beautician.name}</Link>
                  </span>
                )}
              </div>
              <StatusBadge status={b.status} />
            </div>

            <div className="booking-info">
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
              {b.status === "Accepted" && b.beautician?.phone && (
                <span>
                  <FaPhoneAlt />
                  <span>Beautician: {b.beautician.phone}</span>
                </span>
              )}
            </div>

            {b.notes && <p className="booking-note">Your note: {b.notes}</p>}

              <PaymentSection booking={b} role="customer" onChanged={load} />

            <div className="booking-foot">
              <span className="price">{formatPrice(b.price)}</span>

              <div className="booking-actions">
                {ACTIVE.includes(b.status) && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setCancelTarget(b)}
                  >
                    Cancel booking
                  </button>
                )}

                {b.status === "Completed" && !b.hasReview && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setReviewTarget(b)}
                  >
                    Leave a review
                  </button>
                )}

                {b.status === "Completed" && b.hasReview && (
                  <span className="text-muted small">Reviewed, thank you!</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {cancelTarget && (
        <Modal title="Cancel this booking?" onClose={closeModals}>
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <p>
            <strong>{cancelTarget.serviceTitle}</strong>
            <br />
            {formatDateLong(cancelTarget.date)}, {formatTime12(cancelTarget.startTime)}
          </p>
          <p className="text-muted small">
            Pending bookings can be cancelled at any time. Accepted bookings can be cancelled up to 24
            hours before the appointment.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={closeModals}>
              Keep booking
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmCancel} disabled={busy}>
              {busy ? "Cancelling..." : "Yes, cancel it"}
            </button>
          </div>
        </Modal>
      )}

      {reviewTarget && (
        <Modal title="Rate your appointment" onClose={closeModals}>
          <form onSubmit={submitReview} noValidate>
            {modalError && <div className="alert alert-error">{modalError}</div>}
            <p>
              <strong>{reviewTarget.serviceTitle}</strong>
              {reviewTarget.beautician ? ` with ${reviewTarget.beautician.name}` : ""}
            </p>

            <div className="form-group">
              <label>Your rating</label>
              <div className="star-input" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={n <= rating ? "star on" : "star"}
                    onClick={() => {
                      setRating(n);
                      setModalError("");
                    }}
                    aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                  >
                    {n <= rating ? <FaStar /> : <FaRegStar />}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Your comment (optional)</label>
              <textarea
                id="comment"
                className="form-control"
                placeholder="How was your experience?"
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={closeModals}>
                Not now
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}