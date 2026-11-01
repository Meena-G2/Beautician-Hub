import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMyAvailability, saveMyAvailability } from "../services/beauticianService";
import { getErrorMessage } from "../services/api";
import Loader from "../components/Loader";

// 0 = Sunday ... 6 = Saturday, shown from Monday
const DAYS = [
  { n: 1, label: "Monday" },
  { n: 2, label: "Tuesday" },
  { n: 3, label: "Wednesday" },
  { n: 4, label: "Thursday" },
  { n: 5, label: "Friday" },
  { n: 6, label: "Saturday" },
  { n: 0, label: "Sunday" },
];

const defaultRows = () => {
  const rows = {};
  DAYS.forEach((d) => {
    rows[d.n] = { working: false, startTime: "09:00", endTime: "18:00" };
  });
  return rows;
};

const rowsFromSchedule = (schedule) => {
  const rows = defaultRows();
  schedule.forEach((s) => {
    rows[s.dayOfWeek] = {
      working: s.isActive !== false,
      startTime: s.startTime,
      endTime: s.endTime,
    };
  });
  return rows;
};

export default function BeauticianAvailability() {
  const [rows, setRows] = useState(defaultRows());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyAvailability()
      .then((data) => setRows(rowsFromSchedule(data.schedule)))
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const update = (day, changes) => {
    setRows({ ...rows, [day]: { ...rows[day], ...changes } });
    setError("");
  };

  const handleSave = async () => {
    const working = DAYS.filter((d) => rows[d.n].working);

    if (working.length === 0) {
      setError("Select at least one working day");
      return;
    }
    for (const d of working) {
      const row = rows[d.n];
      if (!row.startTime || !row.endTime) {
        setError(`Enter start and end times for ${d.label}`);
        return;
      }
      if (row.startTime >= row.endTime) {
        setError(`On ${d.label}, the end time must be after the start time`);
        return;
      }
    }

    const schedule = working.map((d) => ({
      dayOfWeek: d.n,
      startTime: rows[d.n].startTime,
      endTime: rows[d.n].endTime,
      isActive: true,
    }));

    setSaving(true);
    setError("");
    try {
      const data = await saveMyAvailability(schedule);
      setRows(rowsFromSchedule(data.schedule));
      toast.success("Working hours saved");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading your working hours..." />;

  return (
    <div className="card">
      <div className="card-body">
        <h3>Weekly working hours</h3>
        <p className="text-muted small">
          Customers can book times that fit inside these hours. Changing them does not affect bookings
          you have already accepted.
        </p>

        {loadError && <div className="alert alert-error">{loadError}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="day-list">
          {DAYS.map((d) => {
            const row = rows[d.n];
            return (
              <div key={d.n} className={row.working ? "day-row" : "day-row off"}>
                <label className="day-toggle">
                  <input
                    type="checkbox"
                    checked={row.working}
                    onChange={(e) => update(d.n, { working: e.target.checked })}
                  />
                  <span>{d.label}</span>
                </label>

                {row.working ? (
                  <div className="day-times">
                    <input
                      type="time"
                      className="form-control"
                      value={row.startTime}
                      onChange={(e) => update(d.n, { startTime: e.target.value })}
                      aria-label={`${d.label} start time`}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      className="form-control"
                      value={row.endTime}
                      onChange={(e) => update(d.n, { endTime: e.target.value })}
                      aria-label={`${d.label} end time`}
                    />
                  </div>
                ) : (
                  <span className="text-muted small">Day off</span>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" className="btn btn-primary mt-2" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save working hours"}
        </button>
      </div>
    </div>
  );
}