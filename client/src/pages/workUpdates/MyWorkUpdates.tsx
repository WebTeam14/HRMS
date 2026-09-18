import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
} from "lucide-react";
import {
  getMyWorkUpdates,
  deleteDraftWorkUpdate,
  formatDateDisplay,
  formatHoursDisplay,
} from "../../services/workUpdateService";
import type { WorkUpdate, WorkUpdateStatus } from "../../types";

const MyWorkUpdates = () => {
  const navigate = useNavigate();

  const [updates, setUpdates] = useState<WorkUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [month, setMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkUpdateStatus | "">("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState<{
    totalUpdates: number;
    totalHours: number;
    tasksCompleted: number;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUpdates = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyWorkUpdates({
        month: month || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: 10,
      });

      setUpdates(res.data);
      if (res.meta) {
        setPage(res.meta.page);
        setTotalPages(res.meta.totalPages);
        setTotal(res.meta.total);
      }
      if (res.monthlyStats) {
        setMonthlyStats(res.monthlyStats);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load work updates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates(page);
  }, [month, statusFilter, page]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this draft work update?"
    );
    if (!confirmed) return;

    try {
      setActionLoading(id);
      await deleteDraftWorkUpdate(id);
      await loadUpdates(page);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete work update");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: WorkUpdateStatus) => {
    switch (status) {
      case "APPROVED":
        return <span className="status-badge active">Approved</span>;
      case "SUBMITTED":
        return <span className="status-badge on_leave">Submitted</span>;
      case "CHANGES_REQUESTED":
        return (
          <span
            className="status-badge inactive"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <MessageSquare size={12} /> Changes Requested
          </span>
        );
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
          <h1>My Daily Work Updates</h1>
          <p>Log your daily accomplishments, track tasks, and review manager feedback.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/my-work-updates/new")}
        >
          <Plus size={16} />
          New Work Update
        </button>
      </div>

      {/* Monthly Stats Summary */}
      {monthlyStats && (
        <div className="dashboard-cards" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Send size={20} />
            </div>
            <div className="stat-content">
              <span>Updates Submitted</span>
              <strong>{monthlyStats.totalUpdates}</strong>
              <small>This period</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-content">
              <span>Tasks Completed</span>
              <strong>{monthlyStats.tasksCompleted}</strong>
              <small>Finished tasks</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <span>Total Work Hours</span>
              <strong>{monthlyStats.totalHours} hrs</strong>
              <small>Productive hours logged</small>
            </div>
          </div>
        </div>
      )}

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
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Filter by:</span>
        </div>

        {/* Month */}
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            background: "white",
          }}
        />

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
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="CHANGES_REQUESTED">Changes Requested</option>
        </select>

        {(month || statusFilter) && (
          <button
            type="button"
            className="secondary-button"
            style={{ padding: "8px 12px", fontSize: "13px" }}
            onClick={() => {
              setMonth("");
              setStatusFilter("");
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
          <div className="loading-state">Loading your work updates...</div>
        ) : updates.length === 0 ? (
          <div className="empty-state">No daily work updates found. Click New Work Update to log today's work.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Daily Summary</th>
                <th>Tasks</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{formatDateDisplay(u.date)}</strong>
                  </td>
                  <td style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.summary}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#059669" }}>
                      {u.completedTaskCount ?? 0}
                    </span>{" "}
                    / {u.taskCount ?? 0} done
                  </td>
                  <td>
                    <strong>{formatHoursDisplay(u.totalHours)}</strong>
                  </td>
                  <td>
                    <div>{getStatusBadge(u.status)}</div>
                    {u.status === "CHANGES_REQUESTED" && u.managerComment && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#dc2626",
                          marginTop: "4px",
                          maxWidth: "180px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={u.managerComment}
                      >
                        Note: {u.managerComment}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="table-action-button"
                        title="View Details"
                        onClick={() => navigate(`/my-work-updates/${u._id}`)}
                      >
                        <Eye size={15} />
                      </button>

                      {(u.status === "DRAFT" || u.status === "CHANGES_REQUESTED") && (
                        <button
                          type="button"
                          className="table-action-button"
                          title="Edit Update"
                          onClick={() => navigate(`/my-work-updates/${u._id}/edit`)}
                        >
                          <Edit2 size={15} />
                        </button>
                      )}

                      {u.status === "DRAFT" && (
                        <button
                          type="button"
                          className="table-action-button"
                          style={{ color: "#dc2626" }}
                          title="Delete Draft"
                          disabled={actionLoading === u._id}
                          onClick={() => handleDelete(u._id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
};

export default MyWorkUpdates;
