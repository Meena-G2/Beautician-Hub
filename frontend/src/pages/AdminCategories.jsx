import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/adminService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import CategoryIcon from "../components/CategoryIcon";

const emptyForm = { name: "", description: "", image: "", isActive: true };

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null = closed, "new" = adding, or a category
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getAllCategories();
      setCategories(data.categories);
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

  const openEdit = (category) => {
    setForm({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      isActive: category.isActive,
    });
    setErrors({});
    setServerError("");
    setEditing(category);
  };

  const closeForm = () => setEditing(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setErrors({ ...errors, [name]: "" });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Category name is required";
    if (form.description.length > 300) newErrors.description = "Description cannot be more than 300 characters";
    if (form.image.trim() && !isHttpUrl(form.image.trim())) {
      newErrors.image = "Enter a valid image link starting with http";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
    };

    setSaving(true);
    setServerError("");
    try {
      if (editing === "new") {
        await createCategory(payload);
        toast.success("Category added");
      } else {
        await updateCategory(editing._id, { ...payload, isActive: form.isActive });
        toast.success("Category updated");
      }
      closeForm();
      await load();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category) => {
    setBusyId(category._id);
    try {
      await updateCategory(category._id, { isActive: !category.isActive });
      toast.success(category.isActive ? "Category hidden" : "Category is visible again");
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
      await deleteCategory(deleteTarget._id);
      toast.success("Category deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const fieldClass = (name) => (errors[name] ? "form-control invalid" : "form-control");

  if (loading) return <Loader text="Loading categories..." />;

  return (
    <>
      <div className="page-actions">
        <p className="text-muted">Beauticians choose from these categories when they add a service.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
          <FaPlus /> Add category
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {categories.length === 0 ? (
        <div className="empty-state">
          <h3>No categories yet</h3>
          <p>Add your first service category.</p>
        </div>
      ) : (
        categories.map((c) => (
          <div key={c._id} className="manage-row">
            <div className="service-row-icon">
              <CategoryIcon name={c.name} />
            </div>

            <div className="manage-info">
              <div className="manage-title">
                <h3>{c.name}</h3>
                {c.isActive ? (
                  <span className="badge badge-active">Visible</span>
                ) : (
                  <span className="badge badge-hidden">Hidden</span>
                )}
              </div>
              {c.description && <p className="text-muted small manage-desc">{c.description}</p>}
            </div>

            <div className="manage-side">
              <div className="inline-actions" style={{ marginTop: 0 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => toggleActive(c)}
                  disabled={busyId === c._id}
                >
                  {c.isActive ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setDeleteError("");
                    setDeleteTarget(c);
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
        <Modal title={editing === "new" ? "Add a category" : "Edit category"} onClose={closeForm}>
          <form onSubmit={handleSubmit} noValidate>
            {serverError && <div className="alert alert-error">{serverError}</div>}

            <div className="form-group">
              <label htmlFor="name">Category name</label>
              <input
                id="name"
                name="name"
                className={fieldClass("name")}
                placeholder="e.g. Bridal Makeup"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                className={fieldClass("description")}
                maxLength={300}
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

            {editing !== "new" && (
              <label className="checkbox-row">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                <span>Visible to beauticians and customers</span>
              </label>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? "Saving..." : editing === "new" ? "Add category" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete this category?" onClose={() => setDeleteTarget(null)}>
          {deleteError && <div className="alert alert-error">{deleteError}</div>}
          <p>
            <strong>{deleteTarget.name}</strong> will be removed permanently.
          </p>
          <p className="text-muted small">
            A category that services already use cannot be deleted. Hide it instead.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleteTarget(null)}>
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={confirmDelete}
              disabled={busyId === deleteTarget._id}
            >
              {busyId === deleteTarget._id ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}