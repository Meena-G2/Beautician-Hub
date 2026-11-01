import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaClock } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getServiceById } from "../services/catalogService";
import { getSlots, createBooking } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import { formatPrice, formatDuration } from "../services/format";
import Loader from "../components/Loader";
import RatingStars from "../components/RatingStars";

// ----- small date and time helpers -----

// Today's date in India, like "2026-10-10"
const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// 870 -> "2:30 PM"
const to12h = (minutes) => {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
};

const prettyDate = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function BookingPage() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const minDate = todayIST();
  const maxDate = addDays(minDate, 90);

  const [service, setService] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [address, setAddress] = useState({
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    pincode: user?.address?.pincode || "",
  });
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load the service being booked
  useEffect(() => {
    let active = true;
    setPageLoading(true);
    setPageError("");

    getServiceById(serviceId)
      .then((data) => {
        if (!active) return;
        setService(data.service);
        setProfile(data.beauticianProfile);
      })
      .catch((err) => {
        if (active) setPageError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [serviceId]);

  // Load the free time slots whenever the date changes
  useEffect(() => {
    if (!date || !service) {
      setSlots([]);
      return;
    }

    let active = true;
    setSlotsLoading(true);
    setSlotsError("");

    getSlots(service.beautician._id, date, service._id)
      .then((data) => {
        if (active) setSlots(data.slots);
      })
      .catch((err) => {
        if (active) {
          setSlots([]);
          setSlotsError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [date, service, reloadKey]);

  if (pageLoading) return <Loader text="Loading service..." />;

  if (pageError || !service) {
    return (
      <section className="section">
        <div className="container text-center">
          <div className="alert alert-error">{pageError || "Service not found"}</div>
          <Link to="/services" className="btn btn-primary">
            Browse services
          </Link>
        </div>
      </section>
    );
  }

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setTime("");
    setErrors({ ...errors, date: "", time: "" });
    setServerError("");
  };

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!date) newErrors.date = "Please choose a date";
    else if (date < minDate || date > maxDate) newErrors.date = "Please choose a date within the next 90 days";

    if (!time) newErrors.time = "Please choose a time";

    if (!address.street.trim()) newErrors.street = "Street address is required";
    if (!address.city.trim()) newErrors.city = "City is required";
    if (!address.pincode.trim()) newErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(address.pincode.trim())) newErrors.pincode = "Pincode must be 6 digits";

    if (notes.length > 300) newErrors.notes = "Notes cannot be more than 300 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      await createBooking({
        serviceId: service._id,
        date,
        startTime: time,
        address: {
          street: address.street.trim(),
          city: address.city.trim(),
          pincode: address.pincode.trim(),
        },
        notes: notes.trim() || undefined,
      });

      toast.success("Booking request sent! The beautician will accept or reject it soon.", {
        duration: 6000,
      });
      navigate("/customer");
    } catch (err) {
      setServerError(getErrorMessage(err));
      // Someone else took the slot first: refresh the list of free times
      if (err.response?.status === 409) {
        setTime("");
        setReloadKey((k) => k + 1);
      }
      setSubmitting(false);
    }
  };

  const fieldClass = (name) => (errors[name] ? "form-control invalid" : "form-control");
  const endLabel = time ? to12h(toMinutes(time) + service.durationMinutes) : "";
  const beauticianName = service.beautician?.name || "Beautician";

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Book an Appointment</h1>
          <p className="text-muted">Choose a date and time, and tell us where to come.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="booking-layout">
            <form onSubmit={handleSubmit} noValidate>
              <div className="card">
                <div className="card-body">
                  {serverError && <div className="alert alert-error">{serverError}</div>}

                  <h3 className="form-section-title">1. Choose a date</h3>
                  <div className="form-group">
                    <input
                      id="date"
                      type="date"
                      className={fieldClass("date")}
                      min={minDate}
                      max={maxDate}
                      value={date}
                      onChange={handleDateChange}
                      aria-label="Appointment date"
                    />
                    {errors.date && <div className="form-error">{errors.date}</div>}
                  </div>

                  <h3 className="form-section-title">2. Choose a time</h3>
                  <div className="form-group">
                    {!date && <p className="text-muted small">Select a date to see available times.</p>}

                    {date && slotsLoading && <Loader text="Checking available times..." />}

                    {date && !slotsLoading && slotsError && (
                      <div className="alert alert-error">{slotsError}</div>
                    )}

                    {date && !slotsLoading && !slotsError && slots.length === 0 && (
                      <div className="alert alert-info">
                        No times are available on this day. Please try another date.
                      </div>
                    )}

                    {date && !slotsLoading && slots.length > 0 && (
                      <div className="slot-grid">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={time === slot ? "slot selected" : "slot"}
                            onClick={() => {
                              setTime(slot);
                              setErrors({ ...errors, time: "" });
                              setServerError("");
                            }}
                          >
                            {to12h(toMinutes(slot))}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.time && <div className="form-error">{errors.time}</div>}
                  </div>

                  <h3 className="form-section-title">3. Your address</h3>
                  <div className="form-group">
                    <label htmlFor="street">Street address</label>
                    <input
                      id="street"
                      name="street"
                      className={fieldClass("street")}
                      placeholder="House number, street, area"
                      value={address.street}
                      onChange={handleAddressChange}
                    />
                    {errors.street && <div className="form-error">{errors.street}</div>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        id="city"
                        name="city"
                        className={fieldClass("city")}
                        placeholder="e.g. Mysuru"
                        value={address.city}
                        onChange={handleAddressChange}
                      />
                      {errors.city && <div className="form-error">{errors.city}</div>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="pincode">Pincode</label>
                      <input
                        id="pincode"
                        name="pincode"
                        inputMode="numeric"
                        maxLength={6}
                        className={fieldClass("pincode")}
                        placeholder="6 digits"
                        value={address.pincode}
                        onChange={handleAddressChange}
                      />
                      {errors.pincode && <div className="form-error">{errors.pincode}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Notes for the beautician (optional)</label>
                    <textarea
                      id="notes"
                      className={fieldClass("notes")}
                      placeholder="Anything she should know, like parking or a preferred look"
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setErrors({ ...errors, notes: "" });
                      }}
                      maxLength={300}
                    />
                    {errors.notes && <div className="form-error">{errors.notes}</div>}
                  </div>

                  <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                    {submitting ? "Sending request..." : "Confirm booking request"}
                  </button>
                  <p className="text-muted small text-center mt-2">
                    The beautician needs to accept your request first. After that you can pay online, or pay your beautician directly after the service.
                  </p>
                </div>
              </div>
            </form>

            <aside>
              <div className="card summary-card">
                <div className="card-body">
                  <h3>Booking summary</h3>
                  <h3 style={{ color: "var(--pink-dark)" }}>{service.title}</h3>
                  {service.description && <p className="text-muted small">{service.description}</p>}

                  <div className="summary-row">
                    <span className="text-muted">Beautician</span>
                    <strong>
                      <Link to={`/beauticians/${service.beautician._id}`}>{beauticianName}</Link>
                    </strong>
                  </div>
                  {profile && (
                    <div className="summary-row">
                      <span className="text-muted">Rating</span>
                      <RatingStars rating={profile.averageRating} count={profile.totalReviews} />
                    </div>
                  )}
                  <div className="summary-row">
                    <span className="text-muted">
                      <FaClock /> Duration
                    </span>
                    <strong>{formatDuration(service.durationMinutes)}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="text-muted">Date</span>
                    <strong>{date ? prettyDate(date) : "Not chosen"}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="text-muted">Time</span>
                    <strong>{time ? `${to12h(toMinutes(time))} to ${endLabel}` : "Not chosen"}</strong>
                  </div>
                  <div className="summary-row summary-total">
                    <span>Price</span>
                    <span className="price">{formatPrice(service.price)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}