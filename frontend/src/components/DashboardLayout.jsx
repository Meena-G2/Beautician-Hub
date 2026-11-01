import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../services/format";

export default function DashboardLayout({ title, links, children }) {
  const { user } = useAuth();

  return (
    <section className="dash">
      <div className="container dash-grid">
        <aside className="dash-side">
          <div className="dash-user">
            <div className="avatar avatar-initials">{getInitials(user.name)}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <nav className="dash-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? "dash-link active" : "dash-link")}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="dash-main">
          <h1 className="dash-title">{title}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}