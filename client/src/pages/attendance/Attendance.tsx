import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Building2,
  CheckCircle2,
  AlertTriangle,
  UserX,
  CalendarCheck2,
} from "lucide-react";

import {
  getAttendance,
  formatWorkingHours,
  formatTimeIST,
  formatDateShort,
} from "../../services/attendanceService";
import {
  getDepartments,
  type Department,
} from "../../services/departmentService";
import {
  getEmployees,
  type Employee,
} from "../../services/employeeService";
import type { Attendance, AttendanceStatus, AttendanceSummary } from "../../types";

const AttendanceList = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        getDepartments({ limit: 100 }),
        getEmployees({ limit: 100 }),
      ]);
      setDepartments(deptRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Failed to load filter options:", err);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      const res = await getAttendance({
        date: date || undefined,
        departmentId: departmentId || undefined,
        employeeId: employeeId || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });

      setRecords(res.data);
      if (res.summary) {
        setSummary(res.summary);
      }
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error("Failed to load attendance list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceRecords();
  }, [date, departmentId, employeeId, status, page]);

  const getStatusBadge = (s: AttendanceStatus) => {
    switch (s) {
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
        return <span className="status-badge">{s}</span>;
    }
  };

  return (
    <div className="employees-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Attendance Management</h1>
          <p>Monitor company-wide employee presence, daily hours, and status corrections.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#ecfdf5", color: "#059669" }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Present Today</span>
            <strong style={{ color: "#059669" }}>
              {summary?.present ?? 0}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#fef3c7", color: "#d97706" }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <span>Late Arrivals</span>
            <strong style={{ color: "#d97706" }}>
              {summary?.late ?? 0}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#eff6ff", color: "#2563eb" }}
          >
            <CalendarCheck2 size={20} />
          </div>
          <div>
            <span>On Leave</span>
            <strong style={{ color: "#2563eb" }}>
              {summary?.onLeave ?? 0}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#fef2f2", color: "#dc2626" }}
          >
            <UserX size={20} />
          </div>
          <div>
            <span>Absent</span>
            <strong style={{ color: "#dc2626" }}>
              {summary?.absent ?? 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="employee-toolbar">
        {/* Date Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
            Date:
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setPage(1);
              setDate(e.target.value);
            }}
            style={{
              padding: "7px 10px",
              border: "1px solid #dfe4eb",
              borderRadius: "7px",
              fontSize: "12px",
              outline: "none",
            }}
          />
        </div>

        {/* Department Filter */}
        <select
          value={departmentId}
          onChange={(e) => {
            setPage(1);
            setDepartmentId(e.target.value);
          }}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>

        {/* Employee Filter */}
        <select
          value={employeeId}
          onChange={(e) => {
            setPage(1);
            setEmployeeId(e.target.value);
          }}
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.firstName} {emp.lastName || ""} ({emp.employeeCode})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as AttendanceStatus | "");
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

        {(date || departmentId || employeeId || status) && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setDate("");
              setDepartmentId("");
              setEmployeeId("");
              setStatus("");
              setPage(1);
            }}
            style={{ fontSize: "11px", padding: "6px 12px" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="employee-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: "20px" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const empObj =
                    typeof rec.employeeId === "object" && rec.employeeId
                      ? rec.employeeId
                      : null;

                  const empFullName = empObj
                    ? `${empObj.firstName} ${empObj.lastName || ""}`.trim()
                    : "—";

                  const deptName =
                    empObj?.departmentId?.name || "—";

                  return (
                    <tr key={rec._id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {empObj?.firstName?.[0] || "E"}
                          </div>
                          <div>
                            <strong>{empFullName}</strong>
                            <span>{empObj?.designation || "Employee"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          {empObj?.employeeCode || "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#475569",
                          }}
                        >
                          <Building2 size={13} style={{ color: "#94a3b8" }} />
                          {deptName}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 500, color: "#1e293b" }}>
                          {formatDateShort(rec.date)}
                        </span>
                      </td>

                      <td>{formatTimeIST(rec.checkIn)}</td>

                      <td>{formatTimeIST(rec.checkOut)}</td>

                      <td>
                        <span style={{ fontWeight: 600, color: "#334155" }}>
                          {formatWorkingHours(
                            rec.totalWorkingMinutes,
                            Boolean(rec.checkIn && !rec.checkOut)
                          )}
                        </span>
                      </td>

                      <td>{getStatusBadge(rec.status)}</td>

                      <td style={{ textAlign: "right" }}>
                        <div
                          className="table-actions"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            title="View / Edit Details"
                            onClick={() =>
                              navigate(`/attendance/${rec._id}`)
                            }
                          >
                            <Eye size={15} />
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

        {/* Footer / Pagination */}
        <div className="table-footer">
          <div>
            Showing {records.length} of {total} records
          </div>

          <div className="pagination">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages || 1}
            </span>

            <button
              disabled={page >= totalPages || loading}
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

export default AttendanceList;
