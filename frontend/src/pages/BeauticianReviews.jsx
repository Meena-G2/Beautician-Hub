import { useEffect, useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { getReceivedReviews } from "../services/reviewService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import RatingStars from "../components/RatingStars";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function BeauticianReviews({ profile }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getReceivedReviews()
      .then((data) => setReviews(data.reviews))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading your reviews..." />;

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-card">
        <div className="card-body review-summary">
          <div className="stat-num">{profile && profile.totalReviews ? profile.averageRating.toFixed(1) : "-"}</div>
          <div>
            <RatingStars rating={profile?.averageRating} count={profile?.totalReviews} />
            <div className="text-muted small">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state">
          <h3>No reviews yet</h3>
          <p>After you complete an appointment, the customer can rate it. Reviews will show up here.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            {reviews.map((r) => (
              <div key={r._id} className="review-item">
                <div className="flex-between">
                  <strong>{r.customer?.name || "Customer"}</strong>
                  <span className="text-muted small">{formatDate(r.createdAt)}</span>
                </div>
                <span className="rating-stars">
                  {[1, 2, 3, 4, 5].map((i) => (i <= r.rating ? <FaStar key={i} /> : <FaRegStar key={i} />))}
                </span>
                {r.service?.title && <div className="text-muted small">for {r.service.title}</div>}
                {r.comment && <p className="mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}