import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMessages, setMessageRead, deleteMessage } from "../services/contactService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import Modal from "../components/Modal";

const formatWhen = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getMessages();
      setMessages(data.messages);
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

  const toggleRead = async (item) => {
    setBusyId(item._id);
    try {
      await setMessageRead(item._id, !item.isRead);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const confirmDelete = async () => {
    setBusyId(deleteTarget._id);
    setModalError("");
    try {
      await deleteMessage(deleteTarget._id);
      toast.success("Message deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <Loader text="Loading messages..." />;

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      <p className="results-info">
        {messages.length} {messages.length === 1 ? "message" : "messages"}, {unread} unread
      </p>

      {messages.length === 0 ? (
        <div className="empty-state">
          <h3>No messages yet</h3>
          <p>Messages sent from the Contact page will show up here.</p>
        </div>
      ) : (
        messages.map((m) => (
          <div key={m._id} className={m.isRead ? "booking-card" : "booking-card unread"}>
            <div className="booking-top">
              <div>
                <h3>{m.subject || "No subject"}</h3>
                <span className="text-muted small">
                  {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a> · {formatWhen(m.createdAt)}
                </span>
              </div>
              {!m.isRead && <span className="badge badge-pending">New</span>}
            </div>

            <p className="message-body">{m.message}</p>

            <div className="booking-foot">
              <span className="text-muted small">{m.isRead ? "Marked as read" : "Not read yet"}</span>
              <div className="booking-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => toggleRead(m)}
                  disabled={busyId === m._id}
                >
                  {m.isRead ? "Mark as unread" : "Mark as read"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setModalError("");
                    setDeleteTarget(m);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {deleteTarget && (
        <Modal title="Delete this message?" onClose={() => setDeleteTarget(null)}>
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <p>
            The message from <strong>{deleteTarget.name}</strong> will be removed permanently.
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