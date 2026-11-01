import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaPaintBrush } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import logo from "../assets/logo.png";

const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^[6-9]\d{9}$/;

export default function Register() {
  const { user, loading, register, getDashboardPath } = useAuth();

  const [form, setForm] = useState({
    role: "customer",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loader text="Please wait..." />;

  // Already logged in: go to the dashboard
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const chooseRole = (role) => {
    setForm({ ...form, role });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (form.name.trim().length > 60) newErrors.name = "Name cannot be more than 60 characters";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!emailPattern.test(form.email.trim())) newErrors.email = "Enter a valid email address";

    if (!form.phone.trim()) newErrors.phone = "Mobile number is required";
    else if (!phonePattern.test(form.phone.trim())) newErrors.phone = "Enter a valid 10-digit mobile number";

    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");
    try {
      const created = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });

      if (created.role === "beautician") {
        toast.success("Account created! Complete your profile so the admin can approve it.", {
          duration: 6000,
        });
      } else {
        toast.success(`Welcome to Beautician Hub, ${created.name.split(" ")[0]}!`);
      }
      // The redirect happens automatically because the user is now set
    } catch (error) {
      setServerError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  const fieldClass = (name) => (errors[name] ? "form-control invalid" : "form-control");

  return (
    <section className="auth-page">
      <div className="container">
        <div className="auth-card wide">
          <img src={logo} alt="Beautician Hub" className="auth-logo" />
          <h1>Create your account</h1>
          <p className="auth-sub">Join Beautician Hub as a customer or as a beautician.</p>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>I want to</label>
              <div className="role-options">
                <button
                  type="button"
                  className={form.role === "customer" ? "role-card selected" : "role-card"}
                  onClick={() => chooseRole("customer")}
                >
                  <FaUser />
                  <strong>Book beauty services</strong>
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  className={form.role === "beautician" ? "role-card selected" : "role-card"}
                  onClick={() => chooseRole("beautician")}
                >
                  <FaPaintBrush />
                  <strong>Offer my services</strong>
                  <span>Beautician</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className={fieldClass("name")}
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={fieldClass("email")}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Mobile number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  className={fieldClass("phone")}
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={handleChange}
                />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={fieldClass("password")}
                    placeholder="At least 6 characters"
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

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={fieldClass("confirmPassword")}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            {form.role === "beautician" && (
              <div className="alert alert-info">
                After registering, you will create your professional profile. An admin reviews it
                before you appear to customers.
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </section>
  );
}