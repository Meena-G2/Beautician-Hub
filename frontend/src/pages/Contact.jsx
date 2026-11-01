import { useState } from "react";
import { FaEnvelope, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { sendMessage } from "../services/contactService";
import { getErrorMessage } from "../services/api";

const emailPattern = /^\S+@\S+\.\S+$/;

export default function Contact() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (form.name.trim().length > 60) newErrors.name = "Name cannot be more than 60 characters";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!emailPattern.test(form.email.trim())) newErrors.email = "Enter a valid email address";

    if (form.subject.length > 100) newErrors.subject = "Subject cannot be more than 100 characters";

    if (form.message.trim().length < 10) newErrors.message = "Please write at least 10 characters";
    else if (form.message.length > 1000) newErrors.message = "Message cannot be more than 1000 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    setServerError("");
    try {
      await sendMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const sendAnother = () => {
    setForm({ ...form, subject: "", message: "" });
    setSent(false);
  };

  const fieldClass = (name) => (errors[name] ? "form-control invalid" : "form-control");

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p className="text-muted">Questions, feedback or need help? Send us a message.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="card">
            <div className="card-body">
              {sent ? (
                <div className="text-center">
                  <h3>Thank you!</h3>
                  <div className="alert alert-success">
                    Your message has been received. The Beautician Hub team will read it soon.
                  </div>
                  <p className="text-muted small">
                    This website does not send email replies automatically, so please check the contact
                    details you gave us for any follow-up.
                  </p>
                  <button type="button" className="btn btn-outline btn-sm" onClick={sendAnother}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h3>Send a message</h3>
                  {serverError && <div className="alert alert-error">{serverError}</div>}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Your name</label>
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
                      <label htmlFor="email">Email address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className={fieldClass("email")}
                        value={form.email}
                        onChange={handleChange}
                      />
                      {errors.email && <div className="form-error">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject (optional)</label>
                    <input
                      id="subject"
                      name="subject"
                      className={fieldClass("subject")}
                      maxLength={100}
                      value={form.subject}
                      onChange={handleChange}
                    />
                    {errors.subject && <div className="form-error">{errors.subject}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      className={fieldClass("message")}
                      maxLength={1000}
                      placeholder="How can we help?"
                      value={form.message}
                      onChange={handleChange}
                    />
                    <div className="char-count">{form.message.length}/1000</div>
                    {errors.message && <div className="form-error">{errors.message}</div>}
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
                    {sending ? "Sending..." : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <aside>
            <div className="info-card">
              <FaEnvelope />
              <div>
                <strong>Email</strong>
                <span>support@beauticianhub.example</span>
              </div>
            </div>
            <div className="info-card">
              <FaClock />
              <div>
                <strong>Hours</strong>
                <span>Monday to Saturday, 9 AM to 6 PM</span>
              </div>
            </div>
            <div className="info-card">
              <FaMapMarkerAlt />
              <div>
                <strong>Service areas</strong>
                <span>Beauticians visit you at home across the areas they list on their profiles.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}