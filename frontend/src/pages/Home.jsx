import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaCalendarCheck, FaHome, FaStar } from "react-icons/fa";
import { getCategories, getServices, getBeauticians } from "../services/catalogService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import CategoryIcon from "../components/CategoryIcon";
import ServiceCard from "../components/ServiceCard";
import BeauticianCard from "../components/BeauticianCard";
import logo from "../assets/logo.png";

const steps = [
  { icon: <FaSearch />, title: "1. Search", text: "Find a service or a beautician by name, area or price." },
  { icon: <FaCalendarCheck />, title: "2. Book a time", text: "Pick a date, an available time and your home address." },
  { icon: <FaHome />, title: "3. Relax at home", text: "Your beautician visits once they accept your request." },
  { icon: <FaStar />, title: "4. Share a review", text: "Rate your appointment after it is completed." },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [beauticians, setBeauticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [cat, svc, bea] = await Promise.all([
          getCategories(),
          getServices({ sort: "newest" }),
          getBeauticians(),
        ]);
        if (!active) return;
        setCategories(cat.categories);
        setServices(svc.services);
        setBeauticians(bea.beauticians);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const text = query.trim();
    navigate(text ? `/services?search=${encodeURIComponent(text)}` : "/services");
  };

  return (
    <>
      {/* ===== Hero banner ===== */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="hero-eyebrow">Home beauty services</p>
            <h1>
              Your Beauty, <span>Your Way.</span>
            </h1>
            <p className="lead">
              Book trusted, professional beauticians who come to your doorstep, for bridal makeup,
              hair, skin care, mehendi and more.
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search a service, e.g. bridal makeup"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search services"
              />
              <button type="submit" className="btn btn-primary">
                <FaSearch /> Search
              </button>
            </form>

            <div className="hero-actions">
              <Link to="/services" className="btn btn-plum btn-lg">
                Book Now
              </Link>
              <Link to="/beauticians" className="btn btn-outline btn-lg">
                Find Beauticians
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-logo-card">
              <img src={logo} alt="Beautician Hub" />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="container mt-3">
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {loading ? (
        <Loader text="Loading beauty services..." />
      ) : (
        <>
          {/* ===== Categories ===== */}
          {categories.length > 0 && (
            <section className="section">
              <div className="container">
                <div className="section-title">
                  <h2>Browse by category</h2>
                  <p>From bridal looks to everyday care, choose what you need.</p>
                </div>
                <div className="category-grid">
                  {categories.map((c) => (
                    <Link key={c._id} to={`/services?category=${c._id}`} className="category-tile">
                      <span className="category-icon">
                        <CategoryIcon name={c.name} />
                      </span>
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ===== Featured services ===== */}
          {services.length > 0 && (
            <section className="section section-blush">
              <div className="container">
                <div className="section-title">
                  <h2>Popular services</h2>
                  <p>Book a service in a few taps and get ready at home.</p>
                </div>
                <div className="grid grid-3">
                  {services.slice(0, 6).map((s) => (
                    <ServiceCard key={s._id} service={s} />
                  ))}
                </div>
                <div className="text-center mt-3">
                  <Link to="/services" className="btn btn-outline">
                    View all services
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ===== How it works ===== */}
          <section className="section">
            <div className="container">
              <div className="section-title">
                <h2>How it works</h2>
                <p>Four simple steps from search to a beautiful result.</p>
              </div>
              <div className="steps-grid">
                {steps.map((s) => (
                  <div key={s.title} className="step">
                    <div className="step-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                    <p className="text-muted">{s.text}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <Link to="/how-it-works" className="btn btn-outline">
                  Learn more
                </Link>
              </div>
            </div>
          </section>

          {/* ===== Top beauticians ===== */}
          {beauticians.length > 0 && (
            <section className="section section-blush">
              <div className="container">
                <div className="section-title">
                  <h2>Meet our beauticians</h2>
                  <p>Experienced professionals approved by our team.</p>
                </div>
                <div className="grid grid-3">
                  {beauticians.slice(0, 3).map((b) => (
                    <BeauticianCard key={b._id} beautician={b} />
                  ))}
                </div>
                <div className="text-center mt-3">
                  <Link to="/beauticians" className="btn btn-outline">
                    See all beauticians
                  </Link>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ===== Call to action ===== */}
      <section className="section">
        <div className="container">
          <div className="cta">
            <h2>Are you a beautician?</h2>
            <p>
              Create your profile, add your services and set your own hours. Reach customers who
              want beauty care at home.
            </p>
            <Link to="/register" className="btn btn-light btn-lg">
              Join Beautician Hub
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}