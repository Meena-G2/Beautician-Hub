import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function RatingStars({ rating = 0, count = 0 }) {
  if (!count) {
    return <span className="rating-new">New</span>;
  }

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<FaStar key={i} />);
    else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }

  return (
    <span className="rating">
      <span className="rating-stars">{stars}</span>
      <span className="rating-text">
        {rating.toFixed(1)} ({count})
      </span>
    </span>
  );
}