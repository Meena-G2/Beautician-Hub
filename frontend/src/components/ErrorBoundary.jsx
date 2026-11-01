import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="section">
          <div className="container text-center">
            <h1>Something went wrong</h1>
            <p className="text-muted">
              Sorry, this page could not be shown. Please go back to the home page and try again.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.assign("/")}>
              Back to Home
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}