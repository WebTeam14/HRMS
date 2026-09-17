import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  XCircle,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  getMyLeaveBalances,
  getMyLeaveRequests,
  cancelLeaveRequest,
  formatDateDisplay,
} from "../../services/leaveService";
import type { LeaveBalance, LeaveRequest, LeaveStatus } from "../../types";

const MyLeave = () => {
  const navigate = useNavigate();

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBalances = async () => {
    try {
      setLoadingBalances(true);
      const res = await getMyLeaveBalances();
      setBalances(res.data);
    } catch (err: any) {
      console.error("Failed to load balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  const loadRequests = async (currentPage = 1) => {
    try {
      setLoadingRequests(true);
      setError(null);
      const res = await getMyLeaveRequests({
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 10,
      });
      setRequests(res.data);
      if (res.meta) {
        setPage(res.meta.page);
        setTotalPages(res.meta.totalPages);
        setTotal(res.meta.total);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load leave requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  useEffect(() => {
    loadRequests(page);
  }, [statusFilter, startDate, endDate, page]);

  const handleCancel = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this pending leave request?"
    );
    if (!confirmed) return;

    try {
      setActionLoading(id);
      await cancelLeaveRequest(id);
      await Promise.all([loadBalances(), loadRequests(page)]);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel leave request");
    } finally {
      setActionLoading(null);
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

  return (
    <div className="employees-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Leave</h1>
          <p>View your leave balances, track applications, and apply for time off.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/my-leave/apply")}
        >
          <Plus size={16} />
          Apply for Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>
          Leave Balances ({new Date().getFullYear()})
        </h2>

        {loadingBalances ? (
          <div className="loading-state">Loading your leave balances...</div>
        ) : balances.length === 0 ? (
          <div className="empty-state">No leave balances allocated yet.</div>
        ) : (
          <div className="dashboard-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {balances.map((b) => (
              <div
                key={b._id}
                className="stat-card"
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                    {b.leaveTypeId?.name || "Leave"}
                  </strong>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: b.leaveTypeId?.isPaid ? "#ecfdf5" : "#f1f5f9",
                      color: b.leaveTypeId?.isPaid ? "#059669" : "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {b.leaveTypeId?.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      Remaining
                    </span>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#2563eb", lineHeight: 1.2 }}>
                      {b.remainingDays}{" "}
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>days</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
                    <div>Allocated: <strong>{b.allocatedDays}</strong></div>
                    <div>Used: <strong style={{ color: "#059669" }}>{b.usedDays}</strong></div>
                    {b.pendingDays > 0 && (
                      <div style={{ color: "#d97706" }}>
                        Pending: <strong>{b.pendingDays}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Requests Table Section */}
      <div className="table-container">
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
              Leave History
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              Total {total} application(s) found
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as LeaveStatus | "");
                setPage(1);
              }}
              style={{
                padding: "6px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "13px",
                background: "white",
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "6px 10px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "13px",
                background: "white",
              }}
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "6px 10px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "13px",
                background: "white",
              }}
            />

            {(statusFilter || startDate || endDate) && (
              <button
                type="button"
                className="secondary-button"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => {
                  setStatusFilter("");
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ margin: "16px 20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loadingRequests ? (
          <div className="loading-state">Loading your leave requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">No leave applications found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td>
                    <strong>{req.leaveTypeId?.name || "Leave"}</strong>
                  </td>
                  <td>
                    {formatDateDisplay(req.startDate)} – {formatDateDisplay(req.endDate)}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{req.totalDays}</span> day(s)
                  </td>
                  <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {req.reason}
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td>{formatDateDisplay(req.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="table-action-button"
                        title="View Details"
                        onClick={() => navigate(`/my-leave/${req._id}`)}
                      >
                        <Eye size={15} />
                      </button>

                      {req.status === "PENDING" && (
                        <button
                          type="button"
                          className="table-action-button"
                          style={{ color: "#dc2626" }}
                          title="Cancel Request"
                          disabled={actionLoading === req._id}
                          onClick={() => handleCancel(req._id)}
                        >
                          <XCircle size={15} />
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
              Page {page} of {totalPages}
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

export default MyLeave;
