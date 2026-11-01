import { Link } from "react-router-dom";
import { FaShieldAlt, FaRupeeSign, FaClock, FaHeart } from "react-icons/fa";
import logo from "../assets/logo.png";

const values = [
  {
    icon: <FaShieldAlt />,
    title: "Reviewed beauticians",
    text: "Every beautician profile is reviewed by an admin before it appears on the website.",
  },
  {
    icon: <FaRupeeSign />,
    title: "Clear prices",
    text: "Each service shows its price in rupees and how long it takes, before you book.",
  },
  {
    icon: <FaClock />,
    title: "Your time, your choice",
    text: "Choose from the times a beautician is actually free. The system prevents double bookings.",
  },
  {
    icon: <FaHeart />,
    title: "Honest reviews",
    text: "Only customers with a completed appointment can review, so ratings come from real visits.",
  },
];

export default function About() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>About Us</h1>
          <p className="text-muted">Your Beauty, Your Way.</p>
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div>
            <h2>Beauty care that comes to you</h2>
            <p>
              Beautician Hub connects customers with professional beauticians who provide services at
              home. Whether it is bridal makeup, a hairstyle, a facial, mehendi or saree draping, you can
              find a beautician, compare services and book a time in a few steps.
            </p>
            <p>
              For beauticians, it is a simple way to present their work, set their own prices and working
              hours, and manage booking requests in one place.
            </p>
            <p>
              Beautician Hub was created as a MERN stack project, using React, Node.js, Express and
              MongoDB, and is built so it can grow into a full home beauty-service platform.
            </p>
            <div className="hero-actions">
              <Link to="/services" className="btn btn-primary">
                Explore services
              </Link>
              <Link to="/contact" className="btn btn-outline">
                Contact us
              </Link>
            </div>
          </div>

          <div className="about-logo">
            <img src={logo} alt="Beautician Hub" />
          </div>
        </div>
      </section>

      <section className="section section-blush">
        <div className="container">
          <div className="section-title">
            <h2>What we care about</h2>
          </div>
          <div className="grid grid-4">
            {values.map((v) => (
              <div key={v.title} className="value-card">
                <div className="step-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p className="text-muted">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}