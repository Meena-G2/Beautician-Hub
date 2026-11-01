import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "../services/adminService";
import { getErrorMessage } from "../services/api";
import { formatDateLong, formatTime12 } from "../services/format";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";

const STATUSES = ["Pending", "Accepted", "Completed", "Rejected", "Cancelled"];

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading the overview..." />;
  if (!data) return <div className="alert alert-error">{error || "Could not load the overview"}</div>;

  const { stats, recentBookings } = data;
  const total = stats.bookings || 0;

  return (
    <>
      {stats.pendingApprovals > 0 && (
        <div className="alert alert-info">
          {stats.pendingApprovals} beautician {stats.pendingApprovals === 1 ? "profile is" : "profiles are"}{" "}
          waiting for approval. <Link to="/admin/approvals">Review now</Link>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{stats.customers}</div>
          <div className="stat-label">Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.beauticians}</div>
          <div className="stat-label">Beauticians</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.services}</div>
          <div className="stat-label">Services</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.bookings}</div>
          <div className="stat-label">Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.reviews}</div>
          <div className="stat-label">Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.pendingApprovals}</div>
          <div className="stat-label">Awaiting approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.suspendedUsers}</div>
          <div className="stat-label">Suspended accounts</div>
        </div>
      </div>

      <div className="card mb-card">
        <div className="card-body">
          <h3>Bookings by status</h3>
          {total === 0 ? (
            <p className="text-muted">No bookings yet.</p>
          ) : (
            STATUSES.map((status) => {
              const count = stats.bookingsByStatus[status] || 0;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={status} className="bar-row">
                  <span>{status}</span>
                  <div className="bar-track">
                    <div className={`bar-fill bar-${status.toLowerCase()}`} style={{ width: `${percent}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card table-card">
        <div className="card-body">
          <div className="flex-between">
            <h3>Latest bookings</h3>
            <Link to="/admin/monitor" className="btn btn-outline btn-sm">
              See all
            </Link>
          </div>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-muted card-body">No bookings yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Beautician</th>
                  <th>Service</th>
                  <th>When</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.customer?.name || "-"}</td>
                    <td>{b.beautician?.name || "-"}</td>
                    <td>{b.serviceTitle}</td>
                    <td>
                      {formatDateLong(b.date)}
                      <span className="cell-sub">{formatTime12(b.startTime)}</span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}