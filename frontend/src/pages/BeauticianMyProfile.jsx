import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { saveMyProfile } from "../services/beauticianService";
import { getErrorMessage } from "../services/api";
import { getInitials } from "../services/format";
import StatusBadge from "../components/StatusBadge";

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function BeauticianMyProfile({ profile, onSaved }) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    photo: profile?.photo || "",
    experience: profile ? String(profile.experience) : "",
    serviceArea: profile?.serviceArea || "",
    description: profile?.description || "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoBroken, setPhotoBroken] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
    if (e.target.name === "photo") setPhotoBroken(false);
  };

  const validate = () => {
    const newErrors = {};
    const years = Number(form.experience);

    if (form.experience === "" || !Number.isInteger(years) || years < 0 || years > 60) {
      newErrors.experience = "Enter your experience as a whole number of years (0 to 60)";
    }
    if (!form.serviceArea.trim()) newErrors.serviceArea = "Service area is required";
    if (form.description.length > 1000) newErrors.description = "Description cannot be more than 1000 characters";
    if (form.photo.trim() && !isHttpUrl(form.photo.trim())) {
      newErrors.photo = "Enter a valid photo link starting with http";
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
      const data = await saveMyProfile({
        photo: form.photo.trim(),
        experience: Number(form.experience),
        serviceArea: form.serviceArea.trim(),
        description: form.description.trim(),
      });
      onSaved(data.profile);
      toast.success(data.message || "Profile saved");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (name) => (errors[name] ? "form-control invalid" : "form-control");
  const showPhoto = form.photo.trim() && isHttpUrl(form.photo.trim()) && !photoBroken;

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex-between">
          <h3>Professional profile</h3>
          {profile && <StatusBadge status={profile.approvalStatus} />}
        </div>
        <p className="text-muted small">
          Customers see this on your public profile. An admin approves new profiles before they appear.
        </p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="photo-row">
            {showPhoto ? (
              <img
                className="profile-avatar photo-preview"
                src={form.photo.trim()}
                alt="Profile preview"
                onError={() => setPhotoBroken(true)}
              />
            ) : (
              <div className="profile-avatar avatar-initials photo-preview">{getInitials(user.name)}</div>
            )}
            <div className="form-group photo-input">
              <label htmlFor="photo">Profile photo link (optional)</label>
              <input
                id="photo"
                name="photo"
                className={fieldClass("photo")}
                placeholder="https://..."
                value={form.photo}
                onChange={handleChange}
              />
              {errors.photo && <div className="form-error">{errors.photo}</div>}
              {photoBroken && <div className="form-error">This link did not load as an image</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="experience">Experience (years)</label>
              <input
                id="experience"
                name="experience"
                type="number"
                min="0"
                max="60"
                className={fieldClass("experience")}
                value={form.experience}
                onChange={handleChange}
              />
              {errors.experience && <div className="form-error">{errors.experience}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="serviceArea">Service area</label>
              <input
                id="serviceArea"
                name="serviceArea"
                className={fieldClass("serviceArea")}
                placeholder="e.g. Mysuru - Vijayanagar"
                value={form.serviceArea}
                onChange={handleChange}
              />
              {errors.serviceArea && <div className="form-error">{errors.serviceArea}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">About you</label>
            <textarea
              id="description"
              name="description"
              className={fieldClass("description")}
              maxLength={1000}
              placeholder="Tell customers about your skills, products and style"
              value={form.description}
              onChange={handleChange}
            />
            {errors.description && <div className="form-error">{errors.description}</div>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : profile ? "Save changes" : "Create profile"}
          </button>
        </form>
      </div>
    </div>
  );
}