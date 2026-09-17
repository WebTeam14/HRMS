import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  Send,
} from "lucide-react";
import {
  getAllWorkUpdates,
  approveWorkUpdate,
  requestChangesOnWorkUpdate,
  formatDateDisplay,
  formatHoursDisplay,
} from "../../services/workUpdateService";
import {
  getDepartments,
  type Department,
} from "../../services/departmentService";
import {
  getEmployees,
  type Employee,
} from "../../services/employeeService";
import type { WorkUpdate, WorkUpdateStatus, WorkUpdateSummary } from "../../types";

const WorkUpdateManagement = () => {
  const navigate = useNavigate();

  const [updates, setUpdates] = useState<WorkUpdate[]>([]);
  const [summary, setSummary] = useState<WorkUpdateSummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<WorkUpdateStatus | "">("SUBMITTED");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showChangesModal, setShowChangesModal] = useState<string | null>(null);
  const [managerComment, setManagerComment] = useState("");

  // Load dropdown data
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          getDepartments(),
          getEmployees({ limit: 200 }),
        ]);
        setDepartments(deptRes.data || []);
        setEmployees(empRes.data || []);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  const loadUpdates = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllWorkUpdates({
        status: statusFilter || undefined,
        departmentId: departmentId || undefined,
        employeeId: employeeId || undefined,
        date: date || undefined,
        month: month || undefined,
        page: currentPage,
        limit: 10,
      });

      setUpdates(res.data);
      if (res.summary) {
        setSummary(res.summary);
      }
      if (res.meta) {
        setPage(res.meta.page);
        setTotalPages(res.meta.totalPages);
        setTotal(res.meta.total);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load work updates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates(page);
  }, [statusFilter, departmentId, employeeId, date, month, page]);

  const handleApprove = async (id: string) => {
    const confirmed = window.confirm("Approve this employee's daily work update?");
    if (!confirmed) return;

    try {
      setActionLoading(id);
      await approveWorkUpdate(id);
      await loadUpdates(page);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve work update");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChangesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showChangesModal || !managerComment.trim()) return;

    try {
      setActionLoading(showChangesModal);
      await requestChangesOnWorkUpdate(showChangesModal, managerComment.trim());
      setShowChangesModal(null);
      setManagerComment("");
      await loadUpdates(page);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to request changes");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: WorkUpdateStatus) => {
    switch (status) {
      case "APPROVED":
        return <span className="status-badge active">Approved</span>;
      case "SUBMITTED":
        return <span className="status-badge on_leave">Pending Review</span>;
      case "CHANGES_REQUESTED":
        return <span className="status-badge inactive">Changes Requested</span>;
      case "DRAFT":
        return <span className="status-badge notice_period">Draft</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="employees-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Work Updates Management</h1>
          <p>Review daily employee accomplishments, task hours, and provide feedback.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-cards" style={{ marginBottom: "24px" }}>
        <div
          className="stat-card"
          onClick={() => {
            setStatusFilter("SUBMITTED");
            setPage(1);
          }}
          style={{ cursor: "pointer", border: statusFilter === "SUBMITTED" ? "2px solid #f59e0b" : undefined }}
        >
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span>Pending Reviews</span>
            <strong>{summary?.pending ?? "—"}</strong>
            <small>Awaiting approval</small>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => {
            setStatusFilter("APPROVED");
            setPage(1);
          }}
          style={{ cursor: "pointer", border: statusFilter === "APPROVED" ? "2px solid #10b981" : undefined }}
        >
          <div className="stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-content">
            <span>Approved Updates</span>
            <strong>{summary?.approved ?? "—"}</strong>
            <small>Confirmed submissions</small>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => {
            setStatusFilter("CHANGES_REQUESTED");
            setPage(1);
          }}
          style={{ cursor: "pointer", border: statusFilter === "CHANGES_REQUESTED" ? "2px solid #ef4444" : undefined }}
        >
          <div className="stat-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <MessageSquare size={20} />
          </div>
          <div className="stat-content">
            <span>Changes Requested</span>
            <strong>{summary?.changesRequested ?? "—"}</strong>
            <small>Feedback sent to staff</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Send size={20} />
          </div>
          <div className="stat-content">
            <span>Total Hours Logged</span>
            <strong>{summary?.totalHours ?? "—"} hrs</strong>
            <small>{summary?.tasksCompleted ?? 0} tasks completed</small>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="details-card"
        style={{
          background: "white",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Filters:</span>
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as WorkUpdateStatus | "");
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            background: "white",
          }}
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="CHANGES_REQUESTED">Changes Requested</option>
          <option value="DRAFT">Draft</option>
        </select>

        {/* Department */}
        <select
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            background: "white",
          }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Employee */}
        <select
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            background: "white",
          }}
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.employeeCode} - {emp.firstName} {emp.lastName || ""}
            </option>
          ))}
        </select>

        {/* Single Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setMonth("");
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            background: "white",
          }}
        />

        {/* Month */}
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setDate("");
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            background: "white",
          }}
        />

        {(statusFilter || departmentId || employeeId || date || month) && (
          <button
            type="button"
            className="secondary-button"
            style={{ padding: "7px 12px", fontSize: "13px" }}
            onClick={() => {
              setStatusFilter("");
              setDepartmentId("");
              setEmployeeId("");
              setDate("");
              setMonth("");
              setPage(1);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">Loading work updates...</div>
        ) : updates.length === 0 ? (
          <div className="empty-state">No work updates match your selected filters.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Summary</th>
                <th>Tasks Done</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => {
                const emp =
                  typeof u.employeeId === "object" ? u.employeeId : null;

                return (
                  <tr key={u._id}>
                    <td>
                      <div>
                        <strong>
                          {emp ? `${emp.firstName} ${emp.lastName || ""}` : "—"}
                        </strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {emp?.employeeCode} • {emp?.designation || "Staff"}
                        </div>
                      </div>
                    </td>
                    <td>{emp?.departmentId?.name || "—"}</td>
                    <td>
                      <strong>{formatDateDisplay(u.date)}</strong>
                    </td>
                    <td style={{ maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.summary}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#059669" }}>
                        {u.completedTaskCount ?? 0}
                      </span>{" "}
                      / {u.taskCount ?? 0}
                    </td>
                    <td>
                      <strong>{formatHoursDisplay(u.totalHours)}</strong>
                    </td>
                    <td>{getStatusBadge(u.status)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="table-action-button"
                          title="View Details"
                          onClick={() => navigate(`/work-updates/management/${u._id}`)}
                        >
                          <Eye size={15} />
                        </button>

                        {u.status === "SUBMITTED" && (
                          <>
                            <button
                              type="button"
                              className="table-action-button"
                              style={{ color: "#059669" }}
                              title="Approve"
                              disabled={actionLoading === u._id}
                              onClick={() => handleApprove(u._id)}
                            >
                              <CheckCircle2 size={15} />
                            </button>

                            <button
                              type="button"
                              className="table-action-button"
                              style={{ color: "#d97706" }}
                              title="Request Changes"
                              disabled={actionLoading === u._id}
                              onClick={() => setShowChangesModal(u._id)}
                            >
                              <MessageSquare size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span>
              Page {page} of {totalPages} (Total {total})
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="secondary-button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Changes Modal */}
      {showChangesModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", color: "#0f172a" }}>
              Request Changes on Work Update
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
              Please provide constructive feedback so the employee can revise their update.
            </p>

            <form onSubmit={handleRequestChangesSubmit}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Feedback Comment *
                </label>
                <textarea
                  rows={3}
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  placeholder="e.g. Please clarify actual hours on task #2 or provide more details on the blocker..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowChangesModal(null)}
                  disabled={actionLoading === showChangesModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === showChangesModal || !managerComment.trim()}
                  style={{
                    background: "#d97706",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {actionLoading === showChangesModal ? "Submitting..." : "Send Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkUpdateManagement;
