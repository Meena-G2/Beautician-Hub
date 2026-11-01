import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { getCategories, getBeauticians } from "../services/catalogService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import BeauticianCard from "../components/BeauticianCard";

const readFilters = (params) => ({
  name: params.get("name") || "",
  service: params.get("service") || "",
  location: params.get("location") || "",
  category: params.get("category") || "",
  minPrice: params.get("minPrice") || "",
  maxPrice: params.get("maxPrice") || "",
  sort: params.get("sort") || "rating",
});

export default function FindBeauticians() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();

  const [form, setForm] = useState(readFilters(searchParams));
  const [categories, setCategories] = useState([]);
  const [beauticians, setBeauticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const filters = readFilters(new URLSearchParams(queryString));
    setForm(filters);
    setLoading(true);
    setError("");

    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    getBeauticians(params)
      .then((data) => {
        if (active) setBeauticians(data.beauticians);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryString]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.minPrice && form.maxPrice && Number(form.minPrice) > Number(form.maxPrice)) {
      setFormError("Minimum price cannot be more than maximum price");
      return;
    }

    const params = {};
    Object.entries(form).forEach(([key, value]) => {
      const text = String(value).trim();
      if (text && !(key === "sort" && text === "rating")) params[key] = text;
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFormError("");
    setSearchParams({});
  };

  const hasFilters = queryString !== "";

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Find Beauticians</h1>
          <p className="text-muted">Search by name, service, area or price.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form className="filter-bar" onSubmit={handleSubmit}>
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="name">Beautician name</label>
                <input
                  id="name"
                  name="name"
                  className="form-control"
                  placeholder="e.g. Ananya"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="service">Service</label>
                <input
                  id="service"
                  name="service"
                  className="form-control"
                  placeholder="e.g. facial"
                  value={form.service}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  className="form-control"
                  placeholder="e.g. Mysuru"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  className="form-control"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="minPrice">Min price (₹)</label>
                <input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="0"
                  value={form.minPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxPrice">Max price (₹)</label>
                <input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="20000"
                  value={form.maxPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="sort">Sort by</label>
                <select id="sort" name="sort" className="form-control" value={form.sort} onChange={handleChange}>
                  <option value="rating">Top rated</option>
                  <option value="experience">Most experienced</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {formError && <div className="form-error mt-1">{formError}</div>}

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
            <Loader text="Finding beauticians..." />
          ) : beauticians.length === 0 ? (
            <div className="empty-state">
              <h3>No beauticians found</h3>
              <p>Try a different search, or clear the filters.</p>
              {hasFilters && (
                <button className="btn btn-primary btn-sm" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="results-info">
                Showing {beauticians.length} {beauticians.length === 1 ? "beautician" : "beauticians"}
              </p>
              <div className="grid grid-3">
                {beauticians.map((b) => (
                  <BeauticianCard key={b._id} beautician={b} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}