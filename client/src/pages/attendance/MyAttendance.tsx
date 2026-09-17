import { useEffect, useState } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendanceHistory,
  formatWorkingHours,
  formatTimeIST,
  formatDateShort,
} from "../../services/attendanceService";
import type { Attendance, AttendanceStatus } from "../../types";

const MyAttendance = () => {
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadToday = async () => {
    try {
      setLoadingToday(true);
      const res = await getTodayAttendance();
      setTodayRecord(res.data);
    } catch (err: any) {
      console.error("Failed to load today's attendance:", err);
    } finally {
      setLoadingToday(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await getMyAttendanceHistory({
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 10,
      });
      setHistory(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      console.error("Failed to load attendance history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [statusFilter, startDate, endDate, page]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      const res = await checkIn();
      setTodayRecord(res.data);
      setSuccess("Checked in successfully!");
      loadHistory();
    } catch (err: any) {
      console.error("Check-in failed:", err);
      setError(
        err?.response?.data?.message || "Check-in failed. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to Check Out for today?"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      const res = await checkOut();
      setTodayRecord(res.data);
      setSuccess("Checked out successfully! Total working time calculated.");
      loadHistory();
    } catch (err: any) {
      console.error("Check-out failed:", err);
      setError(
        err?.response?.data?.message || "Check-out failed. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate live working duration if checked in and not checked out
  const getLiveWorkingHours = () => {
    if (!todayRecord || !todayRecord.checkIn) return "0h 0m";
    if (todayRecord.checkOut) {
      return formatWorkingHours(todayRecord.totalWorkingMinutes);
    }
    const checkInMs = new Date(todayRecord.checkIn).getTime();
    const diffMs = Math.max(0, currentTime.getTime() - checkInMs);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return <span className="status-badge status-active">Present</span>;
      case "LATE":
        return <span className="status-badge status-notice">Late</span>;
      case "HALF_DAY":
        return <span className="status-badge status-leave">Half Day</span>;
      case "ON_LEAVE":
        return <span className="status-badge status-leave">On Leave</span>;
      case "ABSENT":
        return <span className="status-badge status-inactive">Absent</span>;
      case "WEEK_OFF":
        return <span className="status-badge status-inactive">Week Off</span>;
      case "HOLIDAY":
        return <span className="status-badge status-notice">Holiday</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="employees-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Attendance</h1>
          <p>Track your daily work hours, check-in timestamps, and presence history.</p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "white",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
            fontWeight: 600,
            color: "#1e293b",
          }}
        >
          <Clock size={16} style={{ color: "#3b82f6" }} />
          <span>
            {currentTime.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </span>
          <span style={{ color: "#94a3b8", fontSize: "11px" }}>IST</span>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "12px 16px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#059669" }} />
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} style={{ color: "#dc2626" }} />
          {error}
        </div>
      )}

      {/* TOP CARD: Today's Attendance Card */}
      <div
        className="details-card"
        style={{
          marginBottom: "24px",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              TODAY'S ATTENDANCE
            </span>
            <h2 style={{ margin: "4px 0 0", fontSize: "20px", color: "#0f172a" }}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          <div>
            {loadingToday ? (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Loading status...
              </span>
            ) : !todayRecord ? (
              <span className="status-badge status-inactive">Not Checked In</span>
            ) : todayRecord.checkOut ? (
              <span className="status-badge status-active">Completed</span>
            ) : (
              <span className="status-badge status-active">
                Checked In • {todayRecord.status}
              </span>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
              Check In
            </span>
            <strong style={{ fontSize: "18px", color: "#0f172a", marginTop: "4px", display: "block" }}>
              {formatTimeIST(todayRecord?.checkIn)}
            </strong>
            <small style={{ fontSize: "10px", color: "#94a3b8" }}>
              {todayRecord?.status === "LATE" ? "Marked as Late" : "Expected 09:30 AM"}
            </small>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
              Check Out
            </span>
            <strong style={{ fontSize: "18px", color: "#0f172a", marginTop: "4px", display: "block" }}>
              {formatTimeIST(todayRecord?.checkOut)}
            </strong>
            <small style={{ fontSize: "10px", color: "#94a3b8" }}>
              {todayRecord?.checkOut ? "Shift ended" : "Expected 06:30 PM"}
            </small>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
              Working Hours
            </span>
            <strong
              style={{
                fontSize: "18px",
                color: todayRecord?.checkIn && !todayRecord?.checkOut ? "#2563eb" : "#0f172a",
                marginTop: "4px",
                display: "block",
              }}
            >
              {getLiveWorkingHours()}
            </strong>
            <small style={{ fontSize: "10px", color: "#94a3b8" }}>
              {todayRecord?.checkIn && !todayRecord?.checkOut
                ? "Live working timer"
                : "Target: 8h 00m"}
            </small>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {!todayRecord ? (
            <button
              type="button"
              className="primary-button"
              onClick={handleCheckIn}
              disabled={actionLoading || loadingToday}
              style={{ padding: "12px 24px", fontSize: "14px" }}
            >
              <LogIn size={18} />
              {actionLoading ? "Checking In..." : "Check In Now"}
            </button>
          ) : !todayRecord.checkOut ? (
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={actionLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LogOut size={18} />
              {actionLoading ? "Checking Out..." : "Check Out"}
            </button>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                padding: "10px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} />
              Attendance Completed For Today
            </div>
          )}
        </div>
      </div>

      {/* ATTENDANCE HISTORY SECTION */}
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", margin: "0 0 4px", color: "#0f172a" }}>
          Attendance History
        </h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
          View past attendance records, daily hours, and statuses.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="employee-toolbar">
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as AttendanceStatus | "");
          }}
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="HALF_DAY">Half Day</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="ABSENT">Absent</option>
          <option value="WEEK_OFF">Week Off</option>
          <option value="HOLIDAY">Holiday</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setPage(1);
              setStartDate(e.target.value);
            }}
            style={{
              padding: "8px 10px",
              border: "1px solid #dfe4eb",
              borderRadius: "7px",
              fontSize: "12px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setPage(1);
              setEndDate(e.target.value);
            }}
            style={{
              padding: "8px 10px",
              border: "1px solid #dfe4eb",
              borderRadius: "7px",
              fontSize: "12px",
              outline: "none",
            }}
          />
        </div>

        {(startDate || endDate || statusFilter) && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setStatusFilter("");
              setPage(1);
            }}
            style={{ fontSize: "11px", padding: "6px 12px" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* History Table Card */}
      <div className="employee-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Loading attendance history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>
                        {formatDateShort(record.date)}
                      </span>
                    </td>

                    <td>{formatTimeIST(record.checkIn)}</td>

                    <td>{formatTimeIST(record.checkOut)}</td>

                    <td>
                      <span style={{ fontWeight: 600, color: "#334155" }}>
                        {formatWorkingHours(
                          record.totalWorkingMinutes,
                          Boolean(record.checkIn && !record.checkOut)
                        )}
                      </span>
                    </td>

                    <td>{getStatusBadge(record.status)}</td>

                    <td>
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}>
                        {record.notes || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-footer">
          <div>
            Showing {history.length} of {total} records
          </div>

          <div className="pagination">
            <button
              disabled={page <= 1 || loadingHistory}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages || 1}
            </span>

            <button
              disabled={page >= totalPages || loadingHistory}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
