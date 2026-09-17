import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  getLeaveTypes,
  getMyLeaveBalances,
  applyLeave,
  calculateCalendarDays,
} from "../../services/leaveService";
import type { LeaveBalance, LeaveType } from "../../types";

const ApplyLeave = () => {
  const navigate = useNavigate();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [typesRes, balancesRes] = await Promise.all([
          getLeaveTypes(true),
          getMyLeaveBalances(),
        ]);
        setLeaveTypes(typesRes.data);
        setBalances(balancesRes.data);

        if (typesRes.data.length > 0) {
          setLeaveTypeId(typesRes.data[0]._id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load leave data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectedBalance = balances.find(
    (b) =>
      b.leaveTypeId?._id === leaveTypeId ||
      (b.leaveTypeId as any) === leaveTypeId
  );

  const calculatedDays = calculateCalendarDays(startDate, endDate);
  const isBalanceExceeded =
    selectedBalance !== undefined &&
    selectedBalance.remainingDays !== undefined &&
    calculatedDays > selectedBalance.remainingDays;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!leaveTypeId) {
      setError("Please select a leave type");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be earlier than start date");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for your leave request");
      return;
    }

    try {
      setSubmitting(true);
      await applyLeave({
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      setSuccess("Leave request submitted successfully! Redirecting...");
      setTimeout(() => {
        navigate("/my-leave");
      }, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.details?.[0]?.message ||
          "Failed to submit leave request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employees-page" style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/my-leave")}
            style={{ marginBottom: "12px" }}
          >
            <ArrowLeft size={16} />
            Back to My Leave
          </button>
          <h1>Apply for Leave</h1>
          <p>Submit a new leave request for manager / HR approval.</p>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {loadingData ? (
        <div className="loading-state">Loading leave options...</div>
      ) : (
        <div className="details-card" style={{ background: "white", padding: "28px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              {/* Leave Type */}
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Leave Type *
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  {leaveTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.code}) {t.isPaid ? "— Paid" : "— Unpaid"}
                    </option>
                  ))}
                </select>

                {/* Available balance highlight */}
                {selectedBalance && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#475569",
                      display: "flex",
                      gap: "16px",
                      background: "#f8fafc",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span>
                      Remaining Balance:{" "}
                      <strong style={{ color: "#2563eb" }}>
                        {selectedBalance.remainingDays} days
                      </strong>
                    </span>
                    <span>
                      Pending: <strong>{selectedBalance.pendingDays} days</strong>
                    </span>
                    <span>
                      Used: <strong>{selectedBalance.usedDays} days</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* End Date */}
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {/* Calculated Days Preview Box */}
            {calculatedDays > 0 && (
              <div
                style={{
                  background: isBalanceExceeded ? "#fef2f2" : "#eff6ff",
                  border: `1px solid ${isBalanceExceeded ? "#fecaca" : "#bfdbfe"}`,
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "13px", color: isBalanceExceeded ? "#991b1b" : "#1e40af" }}>
                    Requested Duration:
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: isBalanceExceeded ? "#b91c1c" : "#1d4ed8" }}>
                    {calculatedDays} Calendar Day(s)
                  </div>
                </div>

                {isBalanceExceeded && (
                  <span style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 600 }}>
                    ⚠️ Exceeds your available balance ({selectedBalance?.remainingDays || 0} remaining)
                  </span>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Reason for Leave *
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe the purpose of your leave..."
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

            {/* Form Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/my-leave")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={submitting || isBalanceExceeded}
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Apply Leave"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
