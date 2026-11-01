export default function PagePlaceholder({ title, note }) {
  return (
    <section className="section">
      <div className="container text-center">
        <h1>{title}</h1>
        <p className="text-muted">
          {note || "This page will be built in an upcoming step."}
        </p>
      </div>
    </section>
  );
}