import { useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaPaintBrush, FaUserShield } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import logo from "../assets/logo.png";

const emailPattern = /^\S+@\S+\.\S+$/;

const roles = [
  {
    key: "customer",
    label: "Customer",
    icon: <FaUser />,
    title: "Customer login",
    sub: "Log in to book and manage your appointments.",
  },
  {
    key: "beautician",
    label: "Beautician",
    icon: <FaPaintBrush />,
    title: "Beautician login",
    sub: "Log in to manage your bookings, services and profile.",
  },
  {
    key: "admin",
    label: "Admin",
    icon: <FaUserShield />,
    title: "Admin login",
    sub: "For authorised staff only.",
  },
];

// If someone was sent here from a protected page, pick the matching tab
const roleFromPath = (path = "") => {
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  if (path === "/beautician" || path.startsWith("/beautician/")) return "beautician";
  return "customer";
};

export default function Login() {
  const { user, loading, login, getDashboardPath } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [fallbackRole] = useState(() => roleFromPath(location.state?.from?.pathname));
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // The chosen login type lives in the address, like /login?as=admin
  const asParam = searchParams.get("as");
  const role = roles.some((r) => r.key === asParam) ? asParam : fallbackRole;
  const current = roles.find((r) => r.key === role);

  // Wait while the app checks for a saved login
  if (loading) return <Loader text="Please wait..." />;

  // Once logged in, go back to the page the visitor wanted, or to their dashboard
  if (user) {
    const target = location.state?.from?.pathname || getDashboardPath(user.role);
    return <Navigate to={target} replace />;
  }

  const selectRole = (key) => {
    setSearchParams({ as: key }, { replace: true, state: location.state });
    setErrors({});
    setServerError("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!emailPattern.test(form.email.trim())) newErrors.email = "Enter a valid email address";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");
    try {
      const loggedIn = await login(form.email.trim(), form.password, role);
      toast.success(`Welcome back, ${loggedIn.name.split(" ")[0]}!`);
      // The redirect happens automatically because the user is now set
    } catch (error) {
      setServerError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="container">
        <div className="auth-card">
          <img src={logo} alt="Beautician Hub" className="auth-logo" />

          <div className="login-tabs" role="tablist" aria-label="Login type">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={role === r.key}
                className={role === r.key ? "login-tab active" : "login-tab"}
                onClick={() => selectRole(r.key)}
              >
                {r.icon}
                {r.label}
              </button>
            ))}
          </div>

          <h1>{current.title}</h1>
          <p className="auth-sub">{current.sub}</p>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={errors.email ? "form-control invalid" : "form-control"}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={errors.password ? "form-control invalid" : "form-control"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? "Logging in..." : current.title}
            </button>
          </form>

          {role === "admin" ? (
            <p className="auth-footer">
              Admin accounts are created by the site administrator and cannot be registered here.
            </p>
          ) : (
            <p className="auth-footer">
              New to Beautician Hub? <Link to="/register">Create an account</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}