import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaMapMarkerAlt, FaBriefcase, FaClock, FaStar, FaRegStar } from "react-icons/fa";
import { getBeauticianById } from "../services/catalogService";
import { getErrorMessage } from "../services/api";
import { formatPrice, formatDuration, getInitials } from "../services/format";
import Loader from "../components/Loader";
import RatingStars from "../components/RatingStars";
import CategoryIcon from "../components/CategoryIcon";

function Stars({ value }) {
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map((i) => (i <= value ? <FaStar key={i} /> : <FaRegStar key={i} />))}
    </span>
  );
}

const formatReviewDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function BeauticianProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getBeauticianById(id)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) {
          setData(null);
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Loader text="Loading profile..." />;

  if (error || !data) {
    return (
      <section className="section">
        <div className="container text-center">
          <div className="alert alert-error">{error || "Beautician not found"}</div>
          <Link to="/beauticians" className="btn btn-primary">
            Back to beauticians
          </Link>
        </div>
      </section>
    );
  }

  const { beautician: profile, services, reviews } = data;
  const name = profile.user?.name || "Beautician";

  return (
    <>
      <section className="profile-hero">
        <div className="container">
          <div className="profile-head">
            {profile.photo ? (
              <img className="profile-avatar" src={profile.photo} alt={name} />
            ) : (
              <div className="profile-avatar avatar-initials">{getInitials(name)}</div>
            )}
            <div>
              <h1>{name}</h1>
              <RatingStars rating={profile.averageRating} count={profile.totalReviews} />
              <div className="profile-facts">
                <span>
                  <FaMapMarkerAlt /> {profile.serviceArea}
                </span>
                <span>
                  <FaBriefcase /> {profile.experience} {profile.experience === 1 ? "year" : "years"} experience
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="profile-layout">
            <div>
              <h2>Services</h2>
              {services.length === 0 ? (
                <div className="empty-state">
                  <h3>No services listed yet</h3>
                  <p>Please check back soon.</p>
                </div>
              ) : (
                services.map((s) => (
                  <div key={s._id} className="service-row">
                    <div className="service-row-icon">
                      <CategoryIcon name={s.category?.name} />
                    </div>
                    <div className="service-row-info">
                      <h3>{s.title}</h3>
                      {s.description && <p className="text-muted small">{s.description}</p>}
                      <span className="text-muted small">
                        <FaClock /> {formatDuration(s.durationMinutes)}
                        {s.category?.name ? ` · ${s.category.name}` : ""}
                      </span>
                    </div>
                    <div className="service-row-side">
                      <div className="price">{formatPrice(s.price)}</div>
                      <Link to={`/book/${s._id}`} className="btn btn-primary btn-sm mt-1">
                        Book Now
                      </Link>
                    </div>
                  </div>
                ))
              )}

              <h2 className="mt-3">Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-muted">No reviews yet.</p>
              ) : (
                <div className="card">
                  <div className="card-body">
                    {reviews.map((r) => (
                      <div key={r._id} className="review-item">
                        <div className="flex-between">
                          <strong>{r.customer?.name || "Customer"}</strong>
                          <span className="text-muted small">{formatReviewDate(r.createdAt)}</span>
                        </div>
                        <Stars value={r.rating} />
                        {r.comment && <p className="mt-1">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside>
              <div className="card">
                <div className="card-body">
                  <h3>About {name.split(" ")[0]}</h3>
                  <p className="text-muted">
                    {profile.description || "This beautician has not added a description yet."}
                  </p>
                  <div className="summary-row">
                    <span className="text-muted">Service area</span>
                    <strong>{profile.serviceArea}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="text-muted">Experience</span>
                    <strong>{profile.experience} years</strong>
                  </div>
                  <div className="summary-row">
                    <span className="text-muted">Services offered</span>
                    <strong>{services.length}</strong>
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