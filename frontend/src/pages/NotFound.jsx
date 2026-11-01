import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container text-center">
        <h1>Page not found</h1>
        <p className="text-muted">The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
      </div>
    </section>
  );
}