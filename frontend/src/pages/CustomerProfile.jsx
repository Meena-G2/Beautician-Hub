import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/authService";
import { getErrorMessage } from "../services/api";

export default function CustomerProfile() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    street: user.address?.street || "",
    city: user.address?.city || "",
    state: user.address?.state || "",
    pincode: user.address?.pincode || "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (form.name.trim().length > 60) newErrors.name = "Name cannot be more than 60 characters";

    if (form.phone.trim() && !/^[6-9]\d{9}$/.test(form.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setServerError("");
    try {
      const data = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        },
      });
      setUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (name) => (errors[name] ? "form-control invalid" : "form-control");

  return (
    <div className="card">
      <div className="card-body">
        <h3>My profile</h3>
        <p className="text-muted small">
          Your address is filled in automatically when you book, and you can change it each time.
        </p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" className="form-control" value={user.email} disabled />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                className={fieldClass("name")}
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Mobile number</label>
              <input
                id="phone"
                name="phone"
                inputMode="numeric"
                maxLength={10}
                className={fieldClass("phone")}
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="street">Street address</label>
            <input
              id="street"
              name="street"
              className="form-control"
              placeholder="House number, street, area"
              value={form.street}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input id="city" name="city" className="form-control" value={form.city} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input id="state" name="state" className="form-control" value={form.state} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 240 }}>
            <label htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              className={fieldClass("pincode")}
              value={form.pincode}
              onChange={handleChange}
            />
            {errors.pincode && <div className="form-error">{errors.pincode}</div>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}