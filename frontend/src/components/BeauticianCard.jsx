import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaBriefcase } from "react-icons/fa";
import RatingStars from "./RatingStars";
import { formatPrice, getInitials } from "../services/format";

export default function BeauticianCard({ beautician }) {
  const name = beautician.user?.name || "Beautician";
  const years = beautician.experience;

  return (
    <div className="card card-hover beautician-card">
      <div className="card-body">
        <div className="beautician-top">
          {beautician.photo ? (
            <img className="avatar" src={beautician.photo} alt={name} loading="lazy" />
          ) : (
            <div className="avatar avatar-initials">{getInitials(name)}</div>
          )}
          <div>
            <h3>{name}</h3>
            <RatingStars rating={beautician.averageRating} count={beautician.totalReviews} />
          </div>
        </div>

        <div className="service-meta">
          <span>
            <FaMapMarkerAlt /> {beautician.serviceArea}
          </span>
          <span>
            <FaBriefcase /> {years} {years === 1 ? "year" : "years"} experience
          </span>
        </div>

        {beautician.description && <p className="service-desc">{beautician.description}</p>}

        {beautician.serviceTitles?.length > 0 && (
          <div className="chips">
            {beautician.serviceTitles.map((title) => (
              <span key={title} className="chip">
                {title}
              </span>
            ))}
          </div>
        )}

        <div className="card-footer-row">
          <span>
            {beautician.startingPrice !== null && beautician.startingPrice !== undefined ? (
              <>
                <span className="text-muted small">From </span>
                <span className="price">{formatPrice(beautician.startingPrice)}</span>
              </>
            ) : (
              <span className="text-muted small">No services yet</span>
            )}
          </span>
          <Link to={`/beauticians/${beautician.user?._id}`} className="btn btn-outline btn-sm">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}