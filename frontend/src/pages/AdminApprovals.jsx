import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaBriefcase } from "react-icons/fa";
import { getProfiles, setApproval } from "../services/adminService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

const TABS = ["Pending", "Approved", "Rejected", "All"];

export default function AdminApprovals() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Pending");
  const [busyId, setBusyId] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getProfiles();
      setProfiles(data.profiles.filter((p) => p.user));
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

  const changeApproval = async (profile, status) => {
    setBusyId(profile._id);
    setModalError("");
    try {
      await setApproval(profile.user._id, status);
      toast.success(status === "Approved" ? "Profile approved" : "Profile rejected");
      setRejectTarget(null);
      await load();
    } catch (err) {
      const text = getErrorMessage(err);
      if (rejectTarget) setModalError(text);
      else toast.error(text);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <Loader text="Loading profiles..." />;

  const count = (status) => profiles.filter((p) => p.approvalStatus === status).length;
  const shown = tab === "All" ? profiles : profiles.filter((p) => p.approvalStatus === tab);

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t} ({t === "All" ? profiles.length : count(t)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty-state">
          <h3>No {tab === "All" ? "" : tab.toLowerCase()} profiles</h3>
          <p>
            {tab === "Pending"
              ? "New beautician profiles waiting for review will show up here."
              : "Nothing to show in this list."}
          </p>
        </div>
      ) : (
        shown.map((p) => (
          <div key={p._id} className="booking-card">
            <div className="booking-top">
              <div>
                <h3>{p.user.name}</h3>
                <span className="text-muted small">
                  Applied{" "}
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="inline-actions" style={{ marginTop: 0 }}>
                {(p.isSuspended || p.user.status === "suspended") && (
                  <span className="badge badge-suspended">Suspended</span>
                )}
                <StatusBadge status={p.approvalStatus} />
              </div>
            </div>

            <div className="booking-info">
              <span>
                <FaEnvelope />
                <span>{p.user.email}</span>
              </span>
              <span>
                <FaPhoneAlt />
                <span>{p.user.phone || "No phone number"}</span>
              </span>
              <span>
                <FaMapMarkerAlt />
                <span>{p.serviceArea}</span>
              </span>
              <span>
                <FaBriefcase />
                <span>
                  {p.experience} {p.experience === 1 ? "year" : "years"} experience
                </span>
              </span>
            </div>

            {p.description && <p className="booking-note">{p.description}</p>}

            <div className="booking-foot">
              {p.approvalStatus === "Approved" ? (
                <Link to={`/beauticians/${p.user._id}`} className="btn btn-outline btn-sm">
                  View public profile
                </Link>
              ) : (
                <span className="text-muted small">Customers cannot see this profile until it is approved.</span>
              )}

              <div className="booking-actions">
                {p.approvalStatus !== "Rejected" && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setModalError("");
                      setRejectTarget(p);
                    }}
                    disabled={busyId === p._id}
                  >
                    Reject
                  </button>
                )}
                {p.approvalStatus !== "Approved" && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => changeApproval(p, "Approved")}
                    disabled={busyId === p._id}
                  >
                    {busyId === p._id ? "Saving..." : "Approve"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {rejectTarget && (
        <Modal title="Reject this profile?" onClose={() => setRejectTarget(null)}>
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <p>
            <strong>{rejectTarget.user.name}</strong> will be hidden from customers. She can update her
            profile, and it goes back to Pending for another review.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setRejectTarget(null)}>
              Go back
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => changeApproval(rejectTarget, "Rejected")}
              disabled={busyId === rejectTarget._id}
            >
              {busyId === rejectTarget._id ? "Saving..." : "Yes, reject"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}