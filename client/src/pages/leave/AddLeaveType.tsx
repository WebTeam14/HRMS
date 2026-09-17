import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { createLeaveType } from "../../services/leaveService";

const AddLeaveType = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [defaultDays, setDefaultDays] = useState<number>(12);
  const [isPaid, setIsPaid] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError("Name and Code are required");
      return;
    }

    try {
      setSubmitting(true);
      await createLeaveType({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        defaultDays: Number(defaultDays),
        isPaid,
        requiresApproval,
        isActive,
      });

      navigate("/leave/types");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.details?.[0]?.message ||
          "Failed to create leave type"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employees-page" style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/leave/types")}
            style={{ marginBottom: "12px" }}
          >
            <ArrowLeft size={16} />
            Back to Leave Types
          </button>
          <h1>Add Leave Type</h1>
          <p>Define a new leave policy and standard allocation for staff.</p>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="details-card" style={{ background: "white", padding: "28px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Leave Type Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bereavement Leave"
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

            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. BEREAVEMENT"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Default Annual Days *
              </label>
              <input
                type="number"
                min={0}
                value={defaultDays}
                onChange={(e) => setDefaultDays(Math.max(0, parseInt(e.target.value || "0", 10)))}
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

            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Paid / Unpaid
              </label>
              <select
                value={isPaid ? "true" : "false"}
                onChange={(e) => setIsPaid(e.target.value === "true")}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <option value="true">Paid Leave</option>
                <option value="false">Unpaid Leave</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief policy explanation or guidelines for this leave category..."
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

          <div style={{ display: "flex", gap: "24px", marginBottom: "28px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "#334155" }}>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
              />
              Requires Management Approval
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "#334155" }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active Status
            </label>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/leave/types")}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              <Save size={16} />
              {submitting ? "Saving..." : "Create Leave Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeaveType;
