import { Link } from "react-router-dom";
import {
  FaSearch,
  FaCalendarCheck,
  FaCheckCircle,
  FaHome,
  FaStar,
  FaUserPlus,
  FaUserCheck,
  FaConciergeBell,
  FaClock,
  FaClipboardList,
} from "react-icons/fa";

const customerSteps = [
  { icon: <FaSearch />, title: "Search", text: "Look for a service or a beautician by name, area or price." },
  { icon: <FaConciergeBell />, title: "Choose a service", text: "Open a profile to see experience, ratings, services and prices in rupees." },
  { icon: <FaCalendarCheck />, title: "Pick a time", text: "Select a date and one of the available times, then enter your home address." },
  { icon: <FaCheckCircle />, title: "Confirm your request", text: "Your booking starts as Pending until the beautician responds." },
  { icon: <FaHome />, title: "Relax at home", text: "Once the request is accepted, the beautician visits you at the chosen time." },
  { icon: <FaStar />, title: "Leave a review", text: "After the appointment is completed, rate it and help others choose." },
];

const beauticianSteps = [
  { icon: <FaUserPlus />, title: "Register", text: "Create an account as a beautician." },
  { icon: <FaUserCheck />, title: "Create your profile", text: "Add your experience, service area and a short description. An admin approves it." },
  { icon: <FaConciergeBell />, title: "Add services", text: "List what you offer with your own prices and durations." },
  { icon: <FaClock />, title: "Set your hours", text: "Choose the days and times when customers can book you." },
  { icon: <FaClipboardList />, title: "Manage requests", text: "Accept or reject requests, then mark appointments completed." },
];

const faqs = [
  {
    q: "How do I know my booking is confirmed?",
    a: "A new booking shows as Pending. When the beautician accepts it, the status changes to Accepted in your dashboard. You can also see Rejected, Cancelled and Completed statuses there.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. A Pending booking can be cancelled at any time. An Accepted booking can be cancelled up to 24 hours before the appointment.",
  },
  {
    q: "How do I pay?",
    a: "After the beautician accepts your booking, you can pay online by UPI, card or netbanking. You can also choose to pay your beautician directly after the service. If you cancel a paid booking, you are refunded.",
  },
  {
    q: "Why can't I see some beauticians?",
    a: "Only beauticians whose profiles an admin has approved appear on the website, and accounts or listings that were suspended are hidden.",
  },
  {
    q: "When can I leave a review?",
    a: "After the beautician marks your appointment as Completed, a Leave a review button appears in your dashboard.",
  },
  {
    q: "I am a beautician. When will customers see me?",
    a: "After an admin approves your profile. Your dashboard shows a banner with your approval status.",
  },
];

function StepList({ steps }) {
  return (
    <div className="steps-grid steps-wrap">
      {steps.map((s, i) => (
        <div key={s.title} className="step">
          <div className="step-icon">{s.icon}</div>
          <h3>
            {i + 1}. {s.title}
          </h3>
          <p className="text-muted">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>How It Works</h1>
          <p className="text-muted">From searching to a beautiful result, in a few simple steps.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>For customers</h2>
            <p>Book professional beauty care at your own home.</p>
          </div>
          <StepList steps={customerSteps} />
          <div className="text-center mt-3">
            <Link to="/services" className="btn btn-primary">
              Browse services
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-blush">
        <div className="container">
          <div className="section-title">
            <h2>For beauticians</h2>
            <p>Reach customers who want beauty care at home, on your own schedule.</p>
          </div>
          <StepList steps={beauticianSteps} />
          <div className="text-center mt-3">
            <Link to="/register" className="btn btn-plum">
              Join as a beautician
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container faq-wrap">
          <div className="section-title">
            <h2>Common questions</h2>
          </div>
          {faqs.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}