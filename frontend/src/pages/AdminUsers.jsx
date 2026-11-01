import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import { getUsers, setUserStatus } from "../services/adminService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

const emptyFilters = { search: "", role: "", status: "" };

export default function AdminUsers() {
  const [form, setForm] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(applied).forEach(([key, value]) => {
        if (value.trim()) params[key] = value.trim();
      });
      const data = await getUsers(params);
      setUsers(data.users);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setApplied(form);
  };

  const clearFilters = () => {
    setForm(emptyFilters);
    setApplied(emptyFilters);
  };

  const changeStatus = async (user, status) => {
    setBusyId(user._id);
    setModalError("");
    try {
      await setUserStatus(user._id, status);
      toast.success(status === "suspended" ? "Account suspended" : "Account reactivated");
      setConfirm(null);
      await load();
    } catch (err) {
      const text = getErrorMessage(err);
      if (confirm) setModalError(text);
      else toast.error(text);
    } finally {
      setBusyId("");
    }
  };

  const hasFilters = Object.values(applied).some((v) => v.trim());

  return (
    <>
      <form className="filter-bar" onSubmit={handleSubmit}>
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="search">Name or email</label>
            <input
              id="search"
              name="search"
              className="form-control"
              placeholder="Search..."
              value={form.search}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="">All roles</option>
              <option value="customer">Customers</option>
              <option value="beautician">Beauticians</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Account status</label>
            <select id="status" name="status" className="form-control" value={form.status} onChange={handleChange}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button type="submit" className="btn btn-primary btn-sm">
            <FaSearch /> Search
          </button>
          {hasFilters && (
            <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader text="Loading users..." />
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Try a different search, or clear the filters.</p>
        </div>
      ) : (
        <>
          <p className="results-info">
            Showing {users.length} {users.length === 1 ? "user" : "users"}
          </p>
          <div className="card table-card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        {u.name}
                        <span className="cell-sub">{u.email}</span>
                      </td>
                      <td>{u.phone || "-"}</td>
                      <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                      <td>
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <StatusBadge status={u.status} />
                      </td>
                      <td>
                        {u.status === "active" ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setModalError("");
                              setConfirm(u);
                            }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => changeStatus(u, "active")}
                            disabled={busyId === u._id}
                          >
                            {busyId === u._id ? "Saving..." : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {confirm && (
        <Modal title="Suspend this account?" onClose={() => setConfirm(null)}>
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <p>
            <strong>{confirm.name}</strong> ({confirm.email}) will not be able to log in.
          </p>
          {confirm.role === "beautician" && (
            <p className="text-muted small">
              Her profile and services are also hidden from customers until you reactivate the account.
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirm(null)}>
              Go back
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => changeStatus(confirm, "suspended")}
              disabled={busyId === confirm._id}
            >
              {busyId === confirm._id ? "Saving..." : "Yes, suspend"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}