import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { getCategories, getServices } from "../services/catalogService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";
import ServiceCard from "../components/ServiceCard";

const readFilters = (params) => ({
  search: params.get("search") || "",
  category: params.get("category") || "",
  minPrice: params.get("minPrice") || "",
  maxPrice: params.get("maxPrice") || "",
  sort: params.get("sort") || "newest",
});

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();

  const [form, setForm] = useState(readFilters(searchParams));
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  // Load the category list once
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  // Load services whenever the filters in the address change
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

    getServices(params)
      .then((data) => {
        if (active) setServices(data.services);
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

  const applyFilters = (next) => {
    const params = {};
    Object.entries(next).forEach(([key, value]) => {
      const text = String(value).trim();
      if (text && !(key === "sort" && text === "newest")) params[key] = text;
    });
    setSearchParams(params);
  };

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
    applyFilters(form);
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
          <h1>Our Services</h1>
          <p className="text-muted">Choose a service, then book a time that suits you.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="category-pills">
            <button
              type="button"
              className={!form.category ? "pill active" : "pill"}
              onClick={() => applyFilters({ ...form, category: "" })}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                type="button"
                className={form.category === c._id ? "pill active" : "pill"}
                onClick={() => applyFilters({ ...form, category: c._id })}
              >
                {c.name}
              </button>
            ))}
          </div>

          <form className="filter-bar" onSubmit={handleSubmit}>
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="search">Search</label>
                <input
                  id="search"
                  name="search"
                  className="form-control"
                  placeholder="e.g. facial"
                  value={form.search}
                  onChange={handleChange}
                />
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
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
              </div>
            </div>

            {formError && <div className="form-error mt-1">{formError}</div>}

            <div className="filter-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                <FaSearch /> Apply filters
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
            <Loader text="Finding services..." />
          ) : services.length === 0 ? (
            <div className="empty-state">
              <h3>No services found</h3>
              <p>Try a different search or clear the filters.</p>
              {hasFilters && (
                <button className="btn btn-primary btn-sm" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="results-info">
                Showing {services.length} {services.length === 1 ? "service" : "services"}
              </p>
              <div className="grid grid-3">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}