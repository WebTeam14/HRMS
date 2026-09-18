import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  getLeaveTypes,
  updateLeaveTypeStatus,
} from "../../services/leaveService";
import type { LeaveType } from "../../types";

const LeaveTypes = () => {
  const navigate = useNavigate();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLeaveTypes(false); // get all including inactive
      setLeaveTypes(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load leave types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const actionText = nextStatus ? "activate" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this leave type?`
    );
    if (!confirmed) return;

    try {
      setActionLoading(id);
      await updateLeaveTypeStatus(id, nextStatus);
      await loadLeaveTypes();
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to ${actionText} leave type`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="employees-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/leave/management")}
            style={{ marginBottom: "12px" }}
          >
            <ArrowLeft size={16} />
            Back to Leave Management
          </button>
          <h1>Leave Types Policy</h1>
          <p>Configure leave categories, default annual allowances, and approval requirements.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/leave/types/new")}
        >
          <Plus size={16} />
          Add Leave Type
        </button>
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
          <div className="loading-state">Loading leave types...</div>
        ) : leaveTypes.length === 0 ? (
          <div className="empty-state">No leave types found. Click Add Leave Type to create one.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name & Code</th>
                <th>Description</th>
                <th>Default Days</th>
                <th>Payment</th>
                <th>Approval</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((type) => (
                <tr key={type._id}>
                  <td>
                    <strong>{type.name}</strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      Code: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{type.code}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: "250px", color: "#475569", fontSize: "13px" }}>
                    {type.description || "—"}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#2563eb" }}>{type.defaultDays}</span> days/yr
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: type.isPaid ? "#ecfdf5" : "#f1f5f9",
                        color: type.isPaid ? "#059669" : "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      {type.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#475569" }}>
                      {type.requiresApproval ? "Required" : "Auto"}
                    </span>
                  </td>
                  <td>
                    {type.isActive ? (
                      <span className="status-badge active">Active</span>
                    ) : (
                      <span className="status-badge inactive">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="table-action-button"
                        title="Edit Leave Type"
                        onClick={() => navigate(`/leave/types/${type._id}/edit`)}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="table-action-button"
                        style={{ color: type.isActive ? "#dc2626" : "#059669" }}
                        title={type.isActive ? "Deactivate" : "Activate"}
                        disabled={actionLoading === type._id}
                        onClick={() => handleToggleStatus(type._id, type.isActive)}
                      >
                        {type.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaveTypes;
