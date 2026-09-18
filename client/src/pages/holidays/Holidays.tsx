import { useEffect, useState } from "react";
import {
  Calendar,
  Sparkles,
  PartyPopper,
  Filter,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getHolidays, createHoliday } from "../../services/holidayService";
import type { Holiday, HolidayType } from "../../types";

const Holidays = () => {
  const { user } = useAuth();
  const isHrOrAdmin =
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "CEO";

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [nextHoliday, setNextHoliday] = useState<Holiday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<HolidayType | "">("");
  const [year, setYear] = useState<number>(2026);
  const [meta, setMeta] = useState({ totalMandatory: 0, totalOptional: 0, total: 0 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    type: "MANDATORY" as HolidayType,
    description: "",
  });

  const loadHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getHolidays({
        year,
        type: typeFilter || undefined,
      });
      setHolidays(res.data);
      if (res.nextHoliday) setNextHoliday(res.nextHoliday);
      if (res.meta) setMeta(res.meta as any);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load company holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [year, typeFilter]);

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name.trim() || !newHoliday.date) {
      setModalError("Please provide holiday name and date");
      return;
    }

    try {
      setCreating(true);
      setModalError(null);
      await createHoliday(newHoliday);
      setShowAddModal(false);
      setNewHoliday({
        name: "",
        date: "",
        type: "MANDATORY",
        description: "",
      });
      await loadHolidays();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || "Failed to add holiday");
    } finally {
      setCreating(false);
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today!";
    if (diff === 1) return "Tomorrow!";
    if (diff > 0) return `in ${diff} days`;
    return "Passed";
  };

  const isUpcoming = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return target >= today;
  };

  return (
    <div className="holidays-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Company Holidays & Calendar</h1>
          <p>Official public and optional holiday calendar for {year}</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isHrOrAdmin && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              Add Holiday
            </button>
          )}

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <option value={2026}>Year 2026</option>
            <option value={2025}>Year 2025</option>
          </select>
        </div>
      </div>

      {/* Next Upcoming Holiday Highlight Card */}
      {nextHoliday && (
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "white",
            borderRadius: "16px",
            padding: "24px 28px",
            marginBottom: "24px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
              }}
            >
              <PartyPopper size={28} />
            </div>

            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#38bdf8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Sparkles size={14} /> Next Upcoming Holiday
              </div>
              <h2 style={{ margin: "4px 0 2px", fontSize: "22px", color: "white" }}>
                {nextHoliday.name}
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
                {new Date(nextHoliday.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              {getDaysUntil(nextHoliday.date)}
            </span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="dashboard-cards" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <span>Total Holidays</span>
            <strong>{meta.total}</strong>
            <small>Calendar year {year}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-content">
            <span>Mandatory (Gazetted)</span>
            <strong>{meta.totalMandatory}</strong>
            <small>Paid public holidays</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
            <Sparkles size={20} />
          </div>
          <div className="stat-content">
            <span>Optional / Restricted</span>
            <strong>{meta.totalOptional}</strong>
            <small>Discretionary off</small>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="details-card"
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={!typeFilter ? "primary-button" : "secondary-button"}
            onClick={() => setTypeFilter("")}
            style={{ fontSize: "13px", padding: "8px 16px" }}
          >
            All Holidays
          </button>
          <button
            type="button"
            className={typeFilter === "MANDATORY" ? "primary-button" : "secondary-button"}
            onClick={() => setTypeFilter("MANDATORY")}
            style={{ fontSize: "13px", padding: "8px 16px" }}
          >
            Mandatory Only
          </button>
          <button
            type="button"
            className={typeFilter === "OPTIONAL" ? "primary-button" : "secondary-button"}
            onClick={() => setTypeFilter("OPTIONAL")}
            style={{ fontSize: "13px", padding: "8px 16px" }}
          >
            Optional Only
          </button>
        </div>

        <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={14} /> Showing {holidays.length} holidays
        </div>
      </div>

      {/* Holiday Cards Grid / Table */}
      {loading ? (
        <div className="details-card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          Loading company holidays...
        </div>
      ) : error ? (
        <div className="details-card" style={{ padding: "30px", color: "#dc2626", background: "#fef2f2" }}>
          {error}
        </div>
      ) : holidays.length === 0 ? (
        <div className="details-card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          No holidays found for selected filter.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {holidays.map((h) => {
            const dateObj = new Date(h.date);
            const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
            const dayNum = dateObj.getDate();
            const upcoming = isUpcoming(h.date);

            return (
              <div
                key={h._id}
                style={{
                  background: "white",
                  borderRadius: "14px",
                  border: upcoming ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                  padding: "18px 20px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  boxShadow: upcoming ? "0 4px 12px rgba(0,0,0,0.03)" : "none",
                  opacity: upcoming ? 1 : 0.7,
                  transition: "all 0.2s ease",
                }}
              >
                {/* Date Badge */}
                <div
                  style={{
                    width: "58px",
                    height: "64px",
                    borderRadius: "10px",
                    background: upcoming ? "#172033" : "#f1f5f9",
                    color: upcoming ? "white" : "#475569",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
                    {monthShort}
                  </span>
                  <strong style={{ fontSize: "22px", lineHeight: "1.1" }}>{dayNum}</strong>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>{h.name}</h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: h.type === "MANDATORY" ? "#f0fdf4" : "#fdf4ff",
                        color: h.type === "MANDATORY" ? "#16a34a" : "#9333ea",
                        flexShrink: 0,
                      }}
                    >
                      {h.type}
                    </span>
                  </div>

                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {h.day} • {upcoming ? getDaysUntil(h.date) : "Past"}
                  </p>
                  {h.description && (
                    <small
                      style={{
                        display: "block",
                        marginTop: "4px",
                        fontSize: "11px",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {h.description}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3>Add Company Holiday</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday}>
              <div className="modal-body">
                {modalError && <div className="error-banner">{modalError}</div>}

                <div className="form-group">
                  <label>Holiday Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Company Gala"
                    value={newHoliday.name}
                    onChange={(e) =>
                      setNewHoliday({ ...newHoliday, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.date}
                    onChange={(e) =>
                      setNewHoliday({ ...newHoliday, date: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Holiday Type *</label>
                  <select
                    value={newHoliday.type}
                    onChange={(e) =>
                      setNewHoliday({
                        ...newHoliday,
                        type: e.target.value as HolidayType,
                      })
                    }
                  >
                    <option value="MANDATORY">Mandatory / Gazetted</option>
                    <option value="OPTIONAL">Optional / Restricted</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description / Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Additional holiday details..."
                    value={newHoliday.description}
                    onChange={(e) =>
                      setNewHoliday({
                        ...newHoliday,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  {creating ? "Saving..." : "Save Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;
