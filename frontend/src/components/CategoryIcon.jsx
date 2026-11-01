import {
  FaRing,
  FaGlassCheers,
  FaMagic,
  FaCut,
  FaSpa,
  FaHandHoldingHeart,
  FaHeart,
  FaFeatherAlt,
  FaPaintBrush,
  FaGift,
} from "react-icons/fa";

const icons = {
  "Bridal Makeup": FaRing,
  "Party Makeup": FaGlassCheers,
  "Hair Styling": FaMagic,
  "Haircut and Hair Care": FaCut,
  "Facial and Skin Care": FaSpa,
  "Manicure and Pedicure": FaHandHoldingHeart,
  "Saree Draping": FaHeart,
  "Waxing and Threading": FaFeatherAlt,
  Mehendi: FaPaintBrush,
  "Basic Beauty Packages": FaGift,
};

export default function CategoryIcon({ name, className }) {
  const Icon = icons[name] || FaSpa;
  return <Icon className={className} />;
}