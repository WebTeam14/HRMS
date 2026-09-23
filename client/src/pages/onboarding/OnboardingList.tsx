import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  FileCheck,
  Sparkles,
  ArrowRight,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  listOnboardings,
  initiateOnboarding,
} from "../../services/onboardingService";
import { getEmployees, type Employee } from "../../services/employeeService";
import type { OnboardingChecklist, OnboardingStatus } from "../../types";

const OnboardingList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [onboardings, setOnboardings] = useState<OnboardingChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Initiate Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [notes, setNotes] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState("");

  const isHrOrAdmin =
    user?.role === "HR" || user?.role === "ADMIN" || user?.role === "CEO";

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await listOnboardings({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setOnboardings(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error("Failed to load onboardings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search, page]);

  const openInitiateModal = async () => {
    setIsModalOpen(true);
    setInitError("");
    try {
      const res = await getEmployees({ limit: 100 });
      setAvailableEmployees(res.data);
      if (res.data.length > 0) {
        setSelectedEmpId(res.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    try {
      setInitiating(true);
      setInitError("");
      await initiateOnboarding(selectedEmpId, { notes });
      setIsModalOpen(false);
      setNotes("");
      loadData();
    } catch (err: any) {
      setInitError(err?.response?.data?.message || "Failed to initiate onboarding");
    } finally {
      setInitiating(false);
    }
  };

  const getStatusBadge = (status: OnboardingStatus) => {
    switch (status) {
      case "INVITED":
        return { label: "Invited", bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc", icon: Clock };
      case "DOCS_PENDING":
        return { label: "Docs Pending", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", icon: AlertCircle };
      case "VERIFIED":
        return { label: "Verified", bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", icon: FileCheck };
      case "ACTIVE":
        return { label: "Active", bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", icon: CheckCircle2 };
      default:
        return { label: status, bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", icon: Clock };
    }
  };

  return (
    <div className="employees-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1>Employee Onboarding</h1>
            <span
              style={{
                fontSize: "12px",
                padding: "3px 10px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#818cf8",
                fontWeight: 600,
              }}
            >
              Module 1
            </span>
          </div>
          <p>
            Track candidate document collection, departmental checklist tasks, and account activation.
          </p>
        </div>

        {isHrOrAdmin && (
          <button className="primary-button" onClick={openInitiateModal}>
            <Plus size={16} /> Initiate Onboarding
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="employee-summary">
          <div className="summary-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <UserPlus size={20} />
          </div>
          <div>
            <span>Total Onboardings</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="employee-summary">
          <div className="summary-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <span>Docs Pending</span>
            <strong>{onboardings.filter((o) => o.status === "DOCS_PENDING").length}</strong>
          </div>
        </div>

        <div className="employee-summary">
          <div className="summary-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
            <FileCheck size={20} />
          </div>
          <div>
            <span>Verified</span>
            <strong>{onboardings.filter((o) => o.status === "VERIFIED").length}</strong>
          </div>
        </div>

        <div className="employee-summary">
          <div className="summary-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Active & Ready</span>
            <strong>{onboardings.filter((o) => o.status === "ACTIVE").length}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="employee-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search candidate by name or code..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All Statuses</option>
          <option value="INVITED">Invited</option>
          <option value="DOCS_PENDING">Docs Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="ACTIVE">Active</option>
        </select>
      </div>

      {/* Table */}
      <div className="employee-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Candidate / Employee</th>
                <th>Department</th>
                <th>Stage & Status</th>
                <th>Tasks Progress</th>
                <th>Initiated Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Loading onboarding records...
                  </td>
                </tr>
              ) : onboardings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No onboarding records found.
                  </td>
                </tr>
              ) : (
                onboardings.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const BadgeIcon = badge.icon;
                  const completedTasks = item.tasks.filter((t) => t.status === "COMPLETED").length;
                  const totalTasks = item.tasks.length;
                  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                  const emp = item.employeeId;

                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {emp?.firstName?.charAt(0)?.toUpperCase() || "E"}
                          </div>
                          <div>
                            <strong>
                              {emp?.firstName} {emp?.lastName || ""}
                            </strong>
                            <span>{emp?.employeeCode} • {emp?.designation || "Candidate"}</span>
                          </div>
                        </div>
                      </td>

                      <td>{emp?.departmentId?.name || "—"}</td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          <BadgeIcon size={13} />
                          {badge.label}
                        </span>
                      </td>

                      <td>
                        <div style={{ minWidth: "120px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px", color: "#94a3b8" }}>
                            <span>{completedTasks} / {totalTasks} Tasks</span>
                            <span>{percent}%</span>
                          </div>
                          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${percent}%`, height: "100%", background: percent === 100 ? "#10b981" : "#6366f1", transition: "width 0.3s" }} />
                          </div>
                        </div>
                      </td>

                      <td>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            title="View Onboarding Details"
                            onClick={() => navigate(`/onboarding/${emp?._id}`)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "6px",
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "#818cf8",
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={14} /> Open <ArrowRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-footer">
            <span>
              Showing {onboardings.length} of {total} records
            </span>
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((c) => Math.max(1, c - 1))}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Initiate Onboarding */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              color: "#fff",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} color="#818cf8" /> Initiate Candidate Onboarding
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {initError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
                ⚠️ {initError}
              </div>
            )}

            <form onSubmit={handleInitiate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                  Select Employee / Candidate:
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                >
                  {availableEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName || ""} ({emp.employeeCode}) — {emp.designation || "New Hire"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                  Onboarding Notes / Instructions:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Remote developer onboarding kit, verify certificates before first week..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initiating}
                  className="primary-button"
                  style={{ minWidth: "140px" }}
                >
                  {initiating ? "Initiating..." : "Create Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingList;
