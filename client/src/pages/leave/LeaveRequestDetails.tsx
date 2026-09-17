import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getLeaveRequest,
  approveLeave,
  rejectLeave,
  cancelLeaveRequest,
  formatDateDisplay,
} from "../../services/leaveService";
import type { LeaveRequest, LeaveStatus } from "../../types";

const LeaveRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isManagement =
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "CEO" ||
    user?.role === "MANAGER";

  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getLeaveRequest(id);
      setRequest(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load leave request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      "Are you sure you want to approve this leave request? This will deduct the employee's balance and update attendance to ON_LEAVE for the requested dates."
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await approveLeave(id);
      await loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve leave request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);
      await rejectLeave(id, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason("");
      await loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject leave request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave request?"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await cancelLeaveRequest(id);
      await loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel leave request");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case "APPROVED":
        return <span className="status-badge active">Approved</span>;
      case "PENDING":
        return <span className="status-badge on_leave">Pending</span>;
      case "REJECTED":
        return <span className="status-badge inactive">Rejected</span>;
      case "CANCELLED":
        return <span className="status-badge notice_period">Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const employeeData =
    typeof request?.employeeId === "object" ? request.employeeId : null;

  return (
    <div className="employees-page" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Back Button & Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(isManagement ? "/leave/management" : "/my-leave")
            }
            style={{ marginBottom: "12px" }}
          >
            <ArrowLeft size={16} />
            {isManagement ? "Back to Leave Management" : "Back to My Leave"}
          </button>
          <h1>Leave Request Details</h1>
          <p>Application summary and workflow status.</p>
        </div>

        {request && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {getStatusBadge(request.status)}

            {isManagement && request.status === "PENDING" && (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}

            {!isManagement && request.status === "PENDING" && (
              <button
                type="button"
                className="secondary-button"
                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                onClick={handleCancel}
                disabled={actionLoading}
              >
                <XCircle size={16} />
                Cancel Request
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
        <div className="loading-state">Loading leave request details...</div>
      ) : !request ? (
        <div className="empty-state">Leave request not found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Employee & Leave Type Summary Card */}
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
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
                <small style={{ color: "#64748b" }}>
                  Code: {employeeData?.departmentId?.code || "—"}
                </small>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Leave Type
                </span>
                <div style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>
                  {request.leaveTypeId?.name || "Leave"}
                </div>
                <small style={{ color: "#64748b" }}>
                  {request.leaveTypeId?.isPaid ? "Paid Leave" : "Unpaid Leave"}
                </small>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Duration
                </span>
                <div style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 700, color: "#2563eb" }}>
                  {request.totalDays} Day(s)
                </div>
                <small style={{ color: "#64748b" }}>
                  {formatDateDisplay(request.startDate)} – {formatDateDisplay(request.endDate)}
                </small>
              </div>
            </div>
          </div>

          {/* Reason Card */}
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Reason for Leave
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#0f172a", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {request.reason}
            </p>
          </div>

          {/* Review Audit Card */}
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Application & Review Timeline
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Applied On:</span>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                  {formatDateDisplay(request.createdAt)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Current Status:</span>
                <div>{getStatusBadge(request.status)}</div>
              </div>

              {request.reviewedBy && (
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Reviewed By:</span>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    {request.reviewedBy.email} ({request.reviewedBy.role})
                  </div>
                </div>
              )}

              {request.reviewedAt && (
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Reviewed On:</span>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    {formatDateDisplay(request.reviewedAt)}
                  </div>
                </div>
              )}
            </div>

            {request.rejectionReason && (
              <div
                style={{
                  marginTop: "16px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <strong style={{ display: "block", color: "#991b1b", fontSize: "13px", marginBottom: "4px" }}>
                  Rejection Reason:
                </strong>
                <p style={{ margin: 0, color: "#7f1d1d", fontSize: "13px" }}>
                  {request.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
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
              Reject Leave Application
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
              Please provide a clear reason for rejecting this leave request. The employee will be notified.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Critical project deadline, lack of department coverage..."
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
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestDetails;
