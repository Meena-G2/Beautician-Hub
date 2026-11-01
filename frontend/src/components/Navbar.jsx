import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import logoIcon from "../assets/logo-icon.png";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services" },
  { to: "/beauticians", label: "Find Beauticians" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    toast.success("You have been logged out");
    navigate("/");
  };

  const linkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          <img src={logoIcon} alt="Beautician Hub logo" />
          <span className="brand-text">
            Beautician
            <span>HUB</span>
          </span>
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>

        <nav className={open ? "nav-menu open" : "nav-menu"}>
          <div className="nav-links">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
                <Link
                  to={getDashboardPath(user.role)}
                  className="btn btn-outline btn-sm"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <button className="btn btn-primary btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}