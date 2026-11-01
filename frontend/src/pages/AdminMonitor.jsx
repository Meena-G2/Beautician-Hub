import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaStar, FaRegStar } from "react-icons/fa";
import {
  getAdminBookings,
  getAdminServices,
  suspendService,
  getAdminReviews,
  deleteReview,
} from "../services/adminService";
import { getErrorMessage } from "../services/api";
import { formatPrice, formatTime12, formatDateLong } from "../services/format";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* ---------------- Bookings ---------------- */
function BookingsTab() {
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = {};
    if (status) params.status = status;
    if (date) params.date = date;

    getAdminBookings(params)
      .then((data) => {
        if (active) {
          setBookings(data.bookings);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, date]);

  return (
    <>
      <div className="filter-bar">
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="b-status">Status</label>
            <select id="b-status" className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {["Pending", "Accepted", "Completed", "Rejected", "Cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="b-date">Appointment date</label>
            <input id="b-date" type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        {(status || date) && (
          <div className="filter-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setStatus("");
                setDate("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader text="Loading bookings..." />
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings found</h3>
          <p>Try a different status or date.</p>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Beautician</th>
                  <th>When</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.serviceTitle}</td>
                    <td>
                      {b.customer?.name || "-"}
                      <span className="cell-sub">{b.customer?.phone}</span>
                    </td>
                    <td>
                      {b.beautician?.name || "-"}
                      <span className="cell-sub">{b.beautician?.phone}</span>
                    </td>
                    <td>
                      {formatDateLong(b.date)}
                      <span className="cell-sub">
                        {formatTime12(b.startTime)} to {formatTime12(b.endTime)}
                      </span>
                    </td>
                    <td>{formatPrice(b.price)}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Services ---------------- */
function ServicesTab() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getAdminServices();
      setServices(data.services);
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

  const changeSuspension = async (service, isSuspended) => {
    setBusyId(service._id);
    setModalError("");
    try {
      await suspendService(service._id, isSuspended);
      toast.success(isSuspended ? "Service suspended" : "Service restored");
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

  if (loading) return <Loader text="Loading services..." />;

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      {services.length === 0 ? (
        <div className="empty-state">
          <h3>No services yet</h3>
          <p>Services that beauticians add will show up here.</p>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Beautician</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id}>
                    <td>{s.title}</td>
                    <td>
                      {s.beautician?.name || "-"}
                      <span className="cell-sub">{s.beautician?.email}</span>
                    </td>
                    <td>{s.category?.name || "-"}</td>
                    <td>{formatPrice(s.price)}</td>
                    <td>
                      {s.isSuspended ? (
                        <span className="badge badge-suspended">Suspended</span>
                      ) : s.isActive ? (
                        <span className="badge badge-active">Visible</span>
                      ) : (
                        <span className="badge badge-hidden">Hidden</span>
                      )}
                    </td>
                    <td>
                      {s.isSuspended ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => changeSuspension(s, false)}
                          disabled={busyId === s._id}
                        >
                          {busyId === s._id ? "Saving..." : "Restore"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setModalError("");
                            setConfirm(s);
                          }}
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <Modal title="Suspend this listing?" onClose={() => setConfirm(null)}>
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <p>
            <strong>{confirm.title}</strong> by {confirm.beautician?.name} will be hidden from customers.
            The beautician cannot restore it, but you can.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirm(null)}>
              Go back
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => changeSuspension(confirm, true)}
              disabled={busyId === confirm._id}
            >
              {busyId === confirm._id ? "Saving..." : "Yes, suspend"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ---------------- Reviews ---------------- */
function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAdminReviews();
      setReviews(data.reviews);
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

  const confirmDelete = async () => {
    setBusy(true);
    setModalError("");
    try {
      await deleteReview(confirm._id);
      toast.success("Review deleted");
      setConfirm(null);
      await load();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader text="Loading reviews..." />;

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      {reviews.length === 0 ? (
        <div className="empty-state">
          <h3>No reviews yet</h3>
          <p>Customer reviews will show up here.</p>
        </div>
      ) : (
        reviews.map((r) => (
          <div key={r._id} className="booking-card">
            <div className="booking-top">
              <div>
                <h3>{r.service?.title || "Service"}</h3>
                <span className="text-muted small">
                  {r.customer?.name || "Customer"} reviewed {r.beautician?.name || "a beautician"} on{" "}
                  {shortDate(r.createdAt)}
                </span>
              </div>
              <span className="rating-stars">
                {[1, 2, 3, 4, 5].map((i) => (i <= r.rating ? <FaStar key={i} /> : <FaRegStar key={i} />))}
              </span>
            </div>
            {r.comment && <p className="booking-note">{r.comment}</p>}
            <div className="booking-foot">
              <span className="text-muted small">Remove reviews that are abusive or inappropriate.</span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  setModalError("");
                  setConfirm(r);
                }}
              >
                Delete review
              </button>
            </div>
          </div>
        ))
      )}

      {confirm && (
        <Modal title="Delete this review?" onClose={() => setConfirm(null)}>
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <p>
            The review by <strong>{confirm.customer?.name || "the customer"}</strong> will be removed, and{" "}
            {confirm.beautician?.name || "the beautician"}'s average rating is recalculated.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirm(null)}>
              Keep it
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete} disabled={busy}>
              {busy ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ---------------- The page ---------------- */
export default function AdminMonitor() {
  const [tab, setTab] = useState("bookings");

  return (
    <>
      <div className="tabs">
        <button type="button" className={tab === "bookings" ? "tab active" : "tab"} onClick={() => setTab("bookings")}>
          Bookings
        </button>
        <button type="button" className={tab === "services" ? "tab active" : "tab"} onClick={() => setTab("services")}>
          Services
        </button>
        <button type="button" className={tab === "reviews" ? "tab active" : "tab"} onClick={() => setTab("reviews")}>
          Reviews
        </button>
      </div>

      {tab === "bookings" && <BookingsTab />}
      {tab === "services" && <ServicesTab />}
      {tab === "reviews" && <ReviewsTab />}
    </>
  );
}