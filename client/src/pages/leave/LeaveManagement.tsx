import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  getAllLeaveRequests,
  getLeaveTypes,
  approveLeave,
  rejectLeave,
  formatDateDisplay,
} from "../../services/leaveService";
import {
  getDepartments,
  type Department,
} from "../../services/departmentService";
import {
  getEmployees,
  type Employee,
} from "../../services/employeeService";
import type {
  LeaveRequest,
  LeaveStatus,
  LeaveSummary,
  LeaveType,
} from "../../types";

const LeaveManagement = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [summary, setSummary] = useState<LeaveSummary | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("PENDING");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Load dropdown metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, empRes, typesRes] = await Promise.all([
          getDepartments(),
          getEmployees({ limit: 200 }),
          getLeaveTypes(),
        ]);
        setDepartments(deptRes.data || []);
        setEmployees(empRes.data || []);
        setLeaveTypes(typesRes.data || []);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  const loadRequests = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllLeaveRequests({
        status: statusFilter || undefined,
        departmentId: departmentId || undefined,
        employeeId: employeeId || undefined,
        leaveTypeId: leaveTypeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 10,
      });

      setRequests(res.data);
      if (res.summary) {
        setSummary(res.summary);
      }
      if (res.meta) {
        setPage(res.meta.page);
        setTotalPages(res.meta.totalPages);
        setTotal(res.meta.total);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(page);
  }, [statusFilter, departmentId, employeeId, leaveTypeId, startDate, endDate, page]);

  const handleApprove = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this leave request? Leave balance will be deducted and attendance will be marked ON_LEAVE for all requested dates."
    );
    if (!confirmed) return;

    try {
      setActionLoading(id);
      await approveLeave(id);
      await loadRequests(page);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve leave request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal || !rejectionReason.trim()) return;

    try {
      setActionLoading(showRejectModal);
      await rejectLeave(showRejectModal, rejectionReason.trim());
      setShowRejectModal(null);
      setRejectionReason("");
      await loadRequests(page);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject leave request");
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
          <h1>Leave Management</h1>
          <p>Review leave applications, manage employee balances, and configure policies.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/leave/types")}
          >
            <Settings size={16} />
            Leave Types
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="dashboard-cards" style={{ marginBottom: "24px" }}>
        <div
          className="stat-card"
          onClick={() => {
            setStatusFilter("PENDING");
            setPage(1);
          }}
          style={{ cursor: "pointer", border: statusFilter === "PENDING" ? "2px solid #f59e0b" : undefined }}
        >
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span>Pending Requests</span>
            <strong>{summary?.pending ?? "—"}</strong>
            <small>Awaiting management review</small>
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
            <span>Approved Total</span>
            <strong>{summary?.approved ?? "—"}</strong>
            <small>Confirmed leave records</small>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => {
            setStatusFilter("REJECTED");
            setPage(1);
          }}
          style={{ cursor: "pointer", border: statusFilter === "REJECTED" ? "2px solid #ef4444" : undefined }}
        >
          <div className="stat-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <XCircle size={20} />
          </div>
          <div className="stat-content">
            <span>Rejected Total</span>
            <strong>{summary?.rejected ?? "—"}</strong>
            <small>Declined applications</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <span>On Leave Today</span>
            <strong>{summary?.onLeaveToday ?? "—"}</strong>
            <small>Employees currently on leave</small>
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
            setStatusFilter(e.target.value as LeaveStatus | "");
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
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
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
              {d.name} ({d.code})
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

        {/* Leave Type */}
        <select
          value={leaveTypeId}
          onChange={(e) => {
            setLeaveTypeId(e.target.value);
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
          <option value="">All Leave Types</option>
          {leaveTypes.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
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

        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
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

        {(statusFilter || departmentId || employeeId || leaveTypeId || startDate || endDate) && (
          <button
            type="button"
            className="secondary-button"
            style={{ padding: "7px 12px", fontSize: "13px" }}
            onClick={() => {
              setStatusFilter("");
              setDepartmentId("");
              setEmployeeId("");
              setLeaveTypeId("");
              setStartDate("");
              setEndDate("");
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

      {/* Requests Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">Loading leave applications...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">No leave applications match the selected criteria.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const emp =
                  typeof req.employeeId === "object" ? req.employeeId : null;

                return (
                  <tr key={req._id}>
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
                      <strong>{req.leaveTypeId?.name || "Leave"}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {req.leaveTypeId?.isPaid ? "Paid" : "Unpaid"}
                      </div>
                    </td>
                    <td>
                      {formatDateDisplay(req.startDate)} – {formatDateDisplay(req.endDate)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{req.totalDays}</span> day(s)
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>{formatDateDisplay(req.createdAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="table-action-button"
                          title="View Details"
                          onClick={() => navigate(`/leave/management/${req._id}`)}
                        >
                          <Eye size={15} />
                        </button>

                        {req.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              className="table-action-button"
                              style={{ color: "#059669" }}
                              title="Approve"
                              disabled={actionLoading === req._id}
                              onClick={() => handleApprove(req._id)}
                            >
                              <CheckCircle2 size={15} />
                            </button>

                            <button
                              type="button"
                              className="table-action-button"
                              style={{ color: "#dc2626" }}
                              title="Reject"
                              disabled={actionLoading === req._id}
                              onClick={() => setShowRejectModal(req._id)}
                            >
                              <XCircle size={15} />
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
              Please provide a clear reason for rejecting this leave request.
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
                  onClick={() => setShowRejectModal(null)}
                  disabled={actionLoading === showRejectModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === showRejectModal || !rejectionReason.trim()}
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
                  {actionLoading === showRejectModal ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
