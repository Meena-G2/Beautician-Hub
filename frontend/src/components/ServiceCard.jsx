import { Link } from "react-router-dom";
import { FaClock, FaMapMarkerAlt } from "react-icons/fa";
import CategoryIcon from "./CategoryIcon";
import RatingStars from "./RatingStars";
import { formatPrice, formatDuration } from "../services/format";

export default function ServiceCard({ service }) {
  const profile = service.beauticianProfile;
  const beautician = service.beautician;

  return (
    <div className="card card-hover service-card">
      <div className="service-media">
        {service.image ? (
          <img src={service.image} alt={service.title} loading="lazy" />
        ) : (
          <div className="service-placeholder">
            <CategoryIcon name={service.category?.name} />
          </div>
        )}
        {service.category?.name && <span className="service-tag">{service.category.name}</span>}
      </div>

      <div className="card-body">
        <h3>{service.title}</h3>
        <p className="service-desc">{service.description}</p>

        {beautician && (
          <p className="service-by">
            by <Link to={`/beauticians/${beautician._id}`}>{beautician.name}</Link>
          </p>
        )}

        <div className="service-meta">
          <span>
            <FaClock /> {formatDuration(service.durationMinutes)}
          </span>
          {profile?.serviceArea && (
            <span>
              <FaMapMarkerAlt /> {profile.serviceArea}
            </span>
          )}
        </div>

        {profile && (
          <div className="mb-1">
            <RatingStars rating={profile.averageRating} count={profile.totalReviews} />
          </div>
        )}

        <div className="card-footer-row">
          <span className="price">{formatPrice(service.price)}</span>
          <Link to={`/book/${service._id}`} className="btn btn-primary btn-sm">
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}