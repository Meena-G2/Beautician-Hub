import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaClock } from "react-icons/fa";
import { getCategories } from "../services/catalogService";
import { getMyServices, createService, updateService, deleteService } from "../services/beauticianService";
import { getErrorMessage } from "../services/api";
import { formatPrice, formatDuration } from "../services/format";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import CategoryIcon from "../components/CategoryIcon";

const emptyForm = {
  title: "",
  category: "",
  price: "",
  durationMinutes: "60",
  description: "",
  image: "",
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function BeauticianServices({ profile }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null = closed, "new" = adding, or a service
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const [svc, cat] = await Promise.all([getMyServices(), getCategories()]);
      setServices(svc.services);
      setCategories(cat.categories);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setServerError("");
    setEditing("new");
  };

  const openEdit = (service) => {
    setForm({
      title: service.title,
      category: service.category?._id || "",
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
      description: service.description || "",
      image: service.image || "",
    });
    setErrors({});
    setServerError("");
    setEditing(service);
  };

  const closeForm = () => setEditing(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Service title is required";
    else if (form.title.trim().length > 100) newErrors.title = "Title cannot be more than 100 characters";

    if (!form.category) newErrors.category = "Please choose a category";

    if (form.price === "" || Number.isNaN(Number(form.price))) newErrors.price = "Enter the price in rupees";
    else if (Number(form.price) < 0) newErrors.price = "Price cannot be negative";

    const minutes = Number(form.durationMinutes);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 600) {
      newErrors.durationMinutes = "Duration must be a whole number from 15 to 600 minutes";
    }

    if (form.description.length > 500) newErrors.description = "Description cannot be more than 500 characters";
    if (form.image.trim() && !isHttpUrl(form.image.trim())) newErrors.image = "Enter a valid image link starting with http";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      category: form.category,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      description: form.description.trim(),
      image: form.image.trim(),
    };

    setSaving(true);
    setServerError("");
    try {
      if (editing === "new") {
        await createService(payload);
        toast.success("Service added");
      } else {
        await updateService(editing._id, payload);
        toast.success("Service updated");
      }
      closeForm();
      await load();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service) => {
    setBusyId(service._id);
    try {
      await updateService(service._id, { isActive: !service.isActive });
      toast.success(service.isActive ? "Service hidden from customers" : "Service is visible again");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const confirmDelete = async () => {
    setBusyId(deleteTarget._id);
    setDeleteError("");
    try {
      await deleteService(deleteTarget._id);
      toast.success("Service deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const fieldClass = (name) => (errors[name] ? "form-control invalid" : "form-control");

  if (loading) return <Loader text="Loading your services..." />;

  return (
    <>
      <div className="page-actions">
        <p className="text-muted">
          Customers see only active services, and only after the admin approves your profile.
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAdd} disabled={!profile}>
          <FaPlus /> Add service
        </button>
      </div>

      {!profile && (
        <div className="alert alert-info">
          Create your professional profile first, then you can add services.{" "}
          <Link to="/beautician/profile">Go to My Profile</Link>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {services.length === 0 ? (
        <div className="empty-state">
          <h3>No services yet</h3>
          <p>Add the services you offer, with a price and how long each one takes.</p>
        </div>
      ) : (
        services.map((s) => (
          <div key={s._id} className="manage-row">
            <div className="service-row-icon">
              <CategoryIcon name={s.category?.name} />
            </div>

            <div className="manage-info">
              <div className="manage-title">
                <h3>{s.title}</h3>
                {s.isSuspended && <span className="badge badge-suspended">Suspended by admin</span>}
                {!s.isSuspended && !s.isActive && <span className="badge badge-hidden">Hidden</span>}
                {!s.isSuspended && s.isActive && <span className="badge badge-active">Visible</span>}
              </div>
              <span className="text-muted small">
                {s.category?.name} · <FaClock /> {formatDuration(s.durationMinutes)}
              </span>
              {s.description && <p className="text-muted small manage-desc">{s.description}</p>}
            </div>

            <div className="manage-side">
              <div className="price">{formatPrice(s.price)}</div>
              <div className="inline-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => toggleActive(s)}
                  disabled={busyId === s._id}
                >
                  {s.isActive ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setDeleteError("");
                    setDeleteTarget(s);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add a service" : "Edit service"} onClose={closeForm}>
          <form onSubmit={handleSubmit} noValidate>
            {serverError && <div className="alert alert-error">{serverError}</div>}

            <div className="form-group">
              <label htmlFor="title">Service title</label>
              <input
                id="title"
                name="title"
                className={fieldClass("title")}
                placeholder="e.g. HD Bridal Makeup"
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" className={fieldClass("category")} value={form.category} onChange={handleChange}>
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price (₹)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  className={fieldClass("price")}
                  placeholder="e.g. 1500"
                  value={form.price}
                  onChange={handleChange}
                />
                {errors.price && <div className="form-error">{errors.price}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="durationMinutes">Duration (minutes)</label>
                <input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min="15"
                  max="600"
                  step="5"
                  className={fieldClass("durationMinutes")}
                  value={form.durationMinutes}
                  onChange={handleChange}
                />
                {errors.durationMinutes && <div className="form-error">{errors.durationMinutes}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                className={fieldClass("description")}
                maxLength={500}
                placeholder="What is included in this service?"
                value={form.description}
                onChange={handleChange}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="image">Image link (optional)</label>
              <input
                id="image"
                name="image"
                className={fieldClass("image")}
                placeholder="https://..."
                value={form.image}
                onChange={handleChange}
              />
              {errors.image && <div className="form-error">{errors.image}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? "Saving..." : editing === "new" ? "Add service" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete this service?" onClose={() => setDeleteTarget(null)}>
          {deleteError && <div className="alert alert-error">{deleteError}</div>}
          <p>
            <strong>{deleteTarget.title}</strong> will be removed permanently.
          </p>
          <p className="text-muted small">
            If it has pending or accepted bookings, hide it instead. Old bookings keep their details.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleteTarget(null)}>
              Keep it
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete} disabled={busyId === deleteTarget._id}>
              {busyId === deleteTarget._id ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}