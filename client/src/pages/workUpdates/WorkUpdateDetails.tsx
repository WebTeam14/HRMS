import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Edit2,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getWorkUpdateById,
  approveWorkUpdate,
  requestChangesOnWorkUpdate,
  formatDateDisplay,
  formatHoursDisplay,
} from "../../services/workUpdateService";
import { formatTimeIST, formatWorkingHours } from "../../services/attendanceService";
import type { WorkTask, WorkUpdate, WorkUpdateStatus } from "../../types";

const WorkUpdateDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isManagement =
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "CEO" ||
    user?.role === "MANAGER";

  const [update, setUpdate] = useState<WorkUpdate | null>(null);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [managerComment, setManagerComment] = useState("");

  const loadDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getWorkUpdateById(id);
      setUpdate(res.data);
      setTasks(res.data.tasks || []);
      setAttendance(res.data.attendance || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load work update details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    const confirmed = window.confirm("Approve this daily work update?");
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await approveWorkUpdate(id);
      await loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve work update");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChangesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !managerComment.trim()) return;

    try {
      setActionLoading(true);
      await requestChangesOnWorkUpdate(id, managerComment.trim());
      setShowChangesModal(false);
      setManagerComment("");
      await loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to request changes");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: WorkUpdateStatus) => {
    switch (status) {
      case "APPROVED":
        return <span className="status-badge active">Approved</span>;
      case "SUBMITTED":
        return <span className="status-badge on_leave">Submitted</span>;
      case "CHANGES_REQUESTED":
        return <span className="status-badge inactive">Changes Requested</span>;
      case "DRAFT":
        return <span className="status-badge notice_period">Draft</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const employeeData =
    typeof update?.employeeId === "object" ? update.employeeId : null;

  return (
    <div className="employees-page" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(isManagement ? "/work-updates/management" : "/my-work-updates")
            }
            style={{ marginBottom: "12px" }}
          >
            <ArrowLeft size={16} />
            {isManagement ? "Back to Work Updates" : "Back to My Work Updates"}
          </button>
          <h1>Daily Work Update Details</h1>
          <p>Task breakdown, accomplishments, and manager review audit.</p>
        </div>

        {update && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {getStatusBadge(update.status)}

            {isManagement && update.status === "SUBMITTED" && (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} />
                  Approve Update
                </button>

                <button
                  type="button"
                  onClick={() => setShowChangesModal(true)}
                  disabled={actionLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#d97706",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <MessageSquare size={16} />
                  Request Changes
                </button>
              </>
            )}

            {!isManagement &&
              (update.status === "DRAFT" || update.status === "CHANGES_REQUESTED") && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate(`/my-work-updates/${update._id}/edit`)}
                >
                  <Edit2 size={16} />
                  Edit Update
                </button>
              )}
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading work update details...</div>
      ) : !update ? (
        <div className="empty-state">Work update not found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Employee & Date Summary Card */}
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Employee
                </span>
                <h3 style={{ margin: "4px 0 0", fontSize: "16px", color: "#0f172a" }}>
                  {employeeData
                    ? `${employeeData.firstName} ${employeeData.lastName || ""}`
                    : "—"}
                </h3>
                <small style={{ color: "#64748b" }}>
                  {employeeData?.employeeCode} • {employeeData?.designation || "Staff"}
                </small>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Department
                </span>
                <div style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>
                  {employeeData?.departmentId?.name || "—"}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Update Date
                </span>
                <div style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 700, color: "#2563eb" }}>
                  {formatDateDisplay(update.date)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Total Hours Logged
                </span>
                <div style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 700, color: "#059669" }}>
                  {formatHoursDisplay(update.totalHours)}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Comparison Info */}
          {attendance && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CalendarCheck size={18} color="#2563eb" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  Recorded Attendance on {formatDateDisplay(update.date)}:
                </span>
              </div>

              <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#475569" }}>
                <span>
                  Check In: <strong>{formatTimeIST(attendance.checkIn)}</strong>
                </span>
                <span>
                  Check Out: <strong>{formatTimeIST(attendance.checkOut)}</strong>
                </span>
                <span>
                  Working Duration:{" "}
                  <strong>{formatWorkingHours(attendance.totalWorkingMinutes)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Summary & Descriptions */}
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 8px", textTransform: "uppercase" }}>
              Daily Summary
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#0f172a", lineHeight: 1.6 }}>
              {update.summary}
            </p>

            {update.accomplishments && (
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ fontSize: "13px", color: "#059669", display: "block", marginBottom: "4px" }}>
                  Accomplishments:
                </strong>
                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {update.accomplishments}
                </p>
              </div>
            )}

            {update.blockers && (
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ fontSize: "13px", color: "#dc2626", display: "block", marginBottom: "4px" }}>
                  Blockers / Issues:
                </strong>
                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {update.blockers}
                </p>
              </div>
            )}

            {update.nextDayPlan && (
              <div>
                <strong style={{ fontSize: "13px", color: "#2563eb", display: "block", marginBottom: "4px" }}>
                  Plan for Tomorrow:
                </strong>
                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {update.nextDayPlan}
                </p>
              </div>
            )}
          </div>

          {/* Tasks Table Card */}
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 16px", textTransform: "uppercase" }}>
              Tasks & Completed Activities ({tasks.length})
            </h3>

            {tasks.length === 0 ? (
              <div className="empty-state">No individual tasks registered in this update.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Est. Hours</th>
                    <th>Actual Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <strong>{task.title}</strong>
                        {task.description && (
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 600,
                            background:
                              task.priority === "HIGH"
                                ? "#fef2f2"
                                : task.priority === "LOW"
                                ? "#f1f5f9"
                                : "#eff6ff",
                            color:
                              task.priority === "HIGH"
                                ? "#dc2626"
                                : task.priority === "LOW"
                                ? "#64748b"
                                : "#2563eb",
                          }}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color:
                              task.status === "COMPLETED"
                                ? "#059669"
                                : task.status === "IN_PROGRESS"
                                ? "#d97706"
                                : "#64748b",
                          }}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{task.estimatedHours || 0} hrs</td>
                      <td>
                        <strong>{task.actualHours || 0} hrs</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Manager Review Box */}
          {(update.reviewedBy || update.managerComment) && (
            <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 12px", textTransform: "uppercase" }}>
                Manager Review Audit
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
                {update.reviewedBy && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Reviewed By:</span>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                      {update.reviewedBy.email} ({update.reviewedBy.role})
                    </div>
                  </div>
                )}

                {update.reviewedAt && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Reviewed On:</span>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                      {formatDateDisplay(update.reviewedAt)}
                    </div>
                  </div>
                )}
              </div>

              {update.managerComment && (
                <div
                  style={{
                    background: update.status === "CHANGES_REQUESTED" ? "#fef3c7" : "#f1f5f9",
                    border: `1px solid ${update.status === "CHANGES_REQUESTED" ? "#fde68a" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                >
                  <strong style={{ display: "block", color: "#92400e", fontSize: "13px", marginBottom: "4px" }}>
                    Manager Feedback / Comment:
                  </strong>
                  <p style={{ margin: 0, color: "#78350f", fontSize: "13px" }}>
                    {update.managerComment}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Request Changes Modal */}
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
              Specify the clarification or revisions needed. The employee will be able to update and resubmit.
            </p>

            <form onSubmit={handleRequestChangesSubmit}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Feedback / Change Request Note *
                </label>
                <textarea
                  rows={3}
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  placeholder="e.g. Please clarify actual hours on task #2 or add details for the client API blocker..."
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
                  onClick={() => setShowChangesModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !managerComment.trim()}
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
                  {actionLoading ? "Submitting..." : "Send Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkUpdateDetails;
