import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Power,
  Building2,
  Users,
  UserCheck,
  Layers,
} from "lucide-react";
import {
  getDepartment,
  updateDepartmentStatus,
  type Department,
} from "../../services/departmentService";

const DepartmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDepartment = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await getDepartment(id);
      setDepartment(res.data);
    } catch (err: any) {
      console.error("Failed to load department:", err);
      setError(
        err?.response?.data?.message || "Failed to load department details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartment();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!department || !id) return;
    const nextStatus = !department.isActive;
    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } this department?`
    );
    if (!confirmed) return;

    try {
      await updateDepartmentStatus(id, nextStatus);
      await loadDepartment();
    } catch (err: any) {
      alert(
        err?.response?.data?.message || "Failed to update department status."
      );
    }
  };

  if (loading) {
    return (
      <div className="employee-details-page">
        <div className="page-loading">Loading department...</div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="employee-details-page">
        <button
          className="back-button"
          onClick={() => navigate("/departments")}
        >
          <ArrowLeft size={18} />
          Back to Departments
        </button>
        <div className="error-card">{error || "Department not found."}</div>
      </div>
    );
  }

  return (
    <div className="employee-details-page">
      {/* Topbar navigation & actions */}
      <div className="details-topbar">
        <button
          className="back-button"
          onClick={() => navigate("/departments")}
        >
          <ArrowLeft size={18} />
          Back to Departments
        </button>

        <div className="details-actions">
          <button
            className="secondary-action"
            onClick={() => navigate(`/departments/${department._id}/edit`)}
          >
            <Edit size={17} />
            Edit
          </button>

          <button
            className={
              !department.isActive ? "primary-action" : "danger-action"
            }
            onClick={handleToggleStatus}
          >
            <Power size={17} />
            {department.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="employee-profile-card">
        <div className="employee-avatar-large">
          <Building2 size={32} />
        </div>

        <div className="employee-profile-info">
          <div className="profile-name-row">
            <h1>{department.name}</h1>
            <span
              className={`status-badge ${
                department.isActive ? "status-active" : "status-inactive"
              }`}
            >
              {department.isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <p className="employee-designation">
            Code: <strong>{department.code}</strong>
          </p>

          <div className="profile-meta">
            <span>
              <Users size={15} />
              {department.employeeCount ?? 0} Employees Assigned
            </span>
            {department.description && (
              <span>
                <Layers size={15} />
                {department.description}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="details-grid">
        {/* Department Info */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <Building2 size={19} />
            </div>
            <div>
              <h2>Department Information</h2>
              <p>Organizational metadata</p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span>Department Name</span>
              <strong>{department.name}</strong>
            </div>

            <div className="info-item">
              <span>Department Code</span>
              <strong>{department.code}</strong>
            </div>

            <div className="info-item">
              <span>Status</span>
              <strong>{department.isActive ? "Active" : "Inactive"}</strong>
            </div>

            <div className="info-item">
              <span>Total Headcount</span>
              <strong>{department.employeeCount ?? 0} Employees</strong>
            </div>

            <div className="info-item" style={{ gridColumn: "1 / -1" }}>
              <span>Description</span>
              <strong>{department.description || "—"}</strong>
            </div>

            <div className="info-item">
              <span>Created At</span>
              <strong>{formatDate(department.createdAt)}</strong>
            </div>

            <div className="info-item">
              <span>Last Updated</span>
              <strong>{formatDate(department.updatedAt)}</strong>
            </div>
          </div>
        </section>

        {/* Manager Info */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <UserCheck size={19} />
            </div>
            <div>
              <h2>Department Head / Manager</h2>
              <p>Assigned manager details</p>
            </div>
          </div>

          {department.managerId ? (
            <div className="info-grid">
              <div className="info-item">
                <span>Manager Name</span>
                <strong>
                  {department.managerId.firstName}{" "}
                  {department.managerId.lastName || ""}
                </strong>
              </div>

              <div className="info-item">
                <span>Employee Code</span>
                <strong>{department.managerId.employeeCode}</strong>
              </div>

              <div className="info-item">
                <span>Designation</span>
                <strong>{department.managerId.designation || "—"}</strong>
              </div>

              <div className="info-item">
                <span>Phone</span>
                <strong>{department.managerId.phone || "—"}</strong>
              </div>

              <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ marginTop: "8px", fontSize: "12px" }}
                  onClick={() =>
                    navigate(`/employees/${department.managerId?._id}`)
                  }
                >
                  View Manager Profile
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "24px 0",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 12px", fontSize: "13px" }}>
                No manager is currently assigned to this department.
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate(`/departments/${department._id}/edit`)}
              >
                Assign Manager
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default DepartmentDetails;
