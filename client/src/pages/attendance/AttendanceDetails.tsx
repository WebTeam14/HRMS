import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  Edit,
  Save,
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserRound,
} from "lucide-react";

import {
  getAttendanceById,
  updateAttendance,
  formatWorkingHours,
  formatTimeIST,
  formatDateShort,
} from "../../services/attendanceService";
import { useAuth } from "../../context/AuthContext";
import type { Attendance, AttendanceStatus } from "../../types";

const AttendanceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isManagement =
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "CEO";

  const [record, setRecord] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    checkInTime: "",
    checkOutTime: "",
    status: "PRESENT" as AttendanceStatus,
    notes: "",
  });

  const loadRecord = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await getAttendanceById(id);
      const data = res.data;
      if (data) {
        setRecord(data);

        // Helper to format ISO to HH:MM for time input
        const toTimeString = (dateStr?: string) => {
          if (!dateStr) return "";
          const d = new Date(dateStr);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          return `${hh}:${mm}`;
        };

        setEditForm({
          checkInTime: toTimeString(data.checkIn),
          checkOutTime: toTimeString(data.checkOut),
          status: data.status,
          notes: data.notes || "",
        });
      }
    } catch (err: any) {
      console.error("Failed to load attendance detail:", err);
      setError(
        err?.response?.data?.message || "Failed to load attendance record."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [id]);

  const handleEditToggle = () => {
    if (!isManagement) return;
    setError("");
    setSuccess("");
    setIsEditing(!isEditing);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCorrection = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !record) return;

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const baseDate = new Date(record.date);
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const date = baseDate.getDate();

      let checkInDate: string | undefined = undefined;
      let checkOutDate: string | null = null;

      if (editForm.checkInTime) {
        const [h, m] = editForm.checkInTime.split(":").map(Number);
        const d = new Date(year, month, date, h, m, 0);
        checkInDate = d.toISOString();
      }

      if (editForm.checkOutTime) {
        const [h, m] = editForm.checkOutTime.split(":").map(Number);
        const d = new Date(year, month, date, h, m, 0);
        checkOutDate = d.toISOString();
      }

      const res = await updateAttendance(id, {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: editForm.status,
        notes: editForm.notes,
      });

      if (res.data) {
        setRecord(res.data);
      }
      setIsEditing(false);
      setSuccess("Attendance record corrected successfully!");
    } catch (err: any) {
      console.error("Failed to update attendance record:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update attendance record. Please verify timestamps."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-details-page">
        <div className="page-loading">Loading attendance details...</div>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="employee-details-page">
        <button
          className="back-button"
          onClick={() =>
            navigate(isManagement ? "/attendance" : "/my-attendance")
          }
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="error-card">{error}</div>
      </div>
    );
  }

  if (!record) return null;

  const empObj =
    typeof record.employeeId === "object" && record.employeeId
      ? record.employeeId
      : null;

  const empFullName = empObj
    ? `${empObj.firstName} ${empObj.lastName || ""}`.trim()
    : "—";

  const deptName = empObj?.departmentId?.name;
  const deptCode = empObj?.departmentId?.code;

  return (
    <div className="employee-details-page">
      {/* Topbar navigation & actions */}
      <div className="details-topbar">
        <button
          className="back-button"
          onClick={() =>
            navigate(isManagement ? "/attendance" : "/my-attendance")
          }
        >
          <ArrowLeft size={16} />
          Back to Attendance
        </button>

        {isManagement && (
          <div className="details-actions">
            <button
              type="button"
              className={isEditing ? "secondary-action" : "primary-button"}
              onClick={handleEditToggle}
            >
              {isEditing ? (
                <>
                  <X size={16} />
                  Cancel Edit
                </>
              ) : (
                <>
                  <Edit size={16} />
                  Correct Attendance
                </>
              )}
            </button>
          </div>
        )}
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

      {/* Header Profile Card */}
      <div className="employee-profile-card">
        <div className="employee-avatar-large">
          <CalendarCheck size={28} />
        </div>

        <div className="employee-profile-info">
          <div className="profile-name-row">
            <h1>{empFullName}</h1>
            <span
              className={`status-badge ${
                record.status === "PRESENT"
                  ? "status-active"
                  : record.status === "LATE"
                  ? "status-notice"
                  : record.status === "HALF_DAY" || record.status === "ON_LEAVE"
                  ? "status-leave"
                  : "status-inactive"
              }`}
            >
              {record.status.replace("_", " ")}
            </span>
          </div>

          <p className="employee-designation">
            {empObj?.designation || "Employee"}
            {deptName && ` • ${deptName} (${deptCode})`}
          </p>

          <div className="profile-meta">
            <span>
              <UserRound size={15} />
              {empObj?.employeeCode || "—"}
            </span>

            <span>
              <Clock size={15} />
              Date: {formatDateShort(record.date)}
            </span>

            <span>
              Source: {record.checkInSource}
            </span>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="details-grid">
        {/* Attendance Information Card */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <Clock size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <h2>Attendance Timestamps</h2>
              <p>Shift punches and recorded durations</p>
            </div>
            {isEditing && (
              <span
                style={{
                  fontSize: "11px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                HR Correction Mode
              </span>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveCorrection}>
              <div className="form-grid" style={{ gap: "14px" }}>
                <div className="form-field">
                  <label>Check In Time</label>
                  <input
                    type="time"
                    name="checkInTime"
                    value={editForm.checkInTime}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Check Out Time</label>
                  <input
                    type="time"
                    name="checkOutTime"
                    value={editForm.checkOutTime}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleFormChange}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="ABSENT">Absent</option>
                    <option value="WEEK_OFF">Week Off</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Notes / Reason for Correction</label>
                  <input
                    name="notes"
                    placeholder="e.g. Approved manual correction by HR"
                    value={editForm.notes}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                  paddingTop: "14px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleEditToggle}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving Correction..." : "Save Correction"}
                </button>
              </div>
            </form>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <span>Check In Time</span>
                <strong>{formatTimeIST(record.checkIn)}</strong>
              </div>

              <div className="info-item">
                <span>Check Out Time</span>
                <strong>{formatTimeIST(record.checkOut)}</strong>
              </div>

              <div className="info-item">
                <span>Total Working Hours</span>
                <strong>
                  {formatWorkingHours(
                    record.totalWorkingMinutes,
                    Boolean(record.checkIn && !record.checkOut)
                  )}
                </strong>
              </div>

              <div className="info-item">
                <span>Status</span>
                <strong>{record.status.replace("_", " ")}</strong>
              </div>

              <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                <span>Notes</span>
                <strong>{record.notes || "—"}</strong>
              </div>
            </div>
          )}
        </section>

        {/* Employee Info Card */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <Building2 size={19} />
            </div>
            <div>
              <h2>Employee Details</h2>
              <p>Organizational placement</p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span>Employee Name</span>
              <strong>{empFullName}</strong>
            </div>

            <div className="info-item">
              <span>Employee Code</span>
              <strong>{empObj?.employeeCode || "—"}</strong>
            </div>

            <div className="info-item">
              <span>Designation</span>
              <strong>{empObj?.designation || "—"}</strong>
            </div>

            <div className="info-item">
              <span>Department</span>
              <strong>
                {deptName ? `${deptName} (${deptCode})` : "—"}
              </strong>
            </div>

            <div className="info-item">
              <span>Record Created</span>
              <strong>{new Date(record.createdAt).toLocaleString("en-IN")}</strong>
            </div>

            <div className="info-item">
              <span>Last Modified</span>
              <strong>{new Date(record.updatedAt).toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AttendanceDetails;
