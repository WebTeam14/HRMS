import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Briefcase,
  Building2,
  UserRound,
  ShieldCheck,
  Power,
} from "lucide-react";

import {
  getEmployee,
  updateEmployeeStatus,
  type Employee,
} from "../../services/employeeService";
import { EditEmployeeModal } from "../../components/employees/EditEmployeeModal";

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployee = async () => {
    try {
      setLoading(true);
      setError("");

      if (!id) {
        setError("Employee ID is missing.");
        return;
      }

      const response = await getEmployee(id);
      setEmployee(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load employee."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const handleStatusChange = async () => {
    if (!employee || !id) return;

    const newStatus =
      employee.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";

    const confirmed = window.confirm(
      `Are you sure you want to ${
        newStatus === "ACTIVE" ? "activate" : "deactivate"
      } this employee?`
    );

    if (!confirmed) return;

    try {
      await updateEmployeeStatus(id, newStatus);
      await loadEmployee();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Failed to update employee status."
      );
    }
  };

  if (loading) {
    return (
      <div className="employee-details-page">
        <div className="page-loading">Loading employee...</div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="employee-details-page">
        <button
          className="back-button"
          onClick={() => navigate("/employees")}
        >
          <ArrowLeft size={18} />
          Back to Employees
        </button>

        <div className="error-card">
          {error || "Employee not found."}
        </div>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${
    employee.lastName || ""
  }`.trim();

  const initials = `${employee.firstName?.[0] || ""}${
    employee.lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="employee-details-page">
      {/* Header */}
      <div className="details-topbar">
        <button
          className="back-button"
          onClick={() => navigate("/employees")}
        >
          <ArrowLeft size={18} />
          Back to Employees
        </button>

        <div className="details-actions">
          <button
            className="secondary-action"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit size={17} />
            Edit
          </button>

          <button
            className={
              employee.status === "INACTIVE"
                ? "primary-action"
                : "danger-action"
            }
            onClick={handleStatusChange}
          >
            <Power size={17} />
            {employee.status === "INACTIVE"
              ? "Activate"
              : "Deactivate"}
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="employee-profile-card">
        <div className="employee-avatar-large">{initials}</div>

        <div className="employee-profile-info">
          <div className="profile-name-row">
            <h1>{fullName}</h1>

            <span
              className={`status-badge status-${employee.status.toLowerCase()}`}
            >
              {employee.status.replace("_", " ")}
            </span>
          </div>

          <p className="employee-designation">
            {employee.designation || "No designation"}
          </p>

          <div className="profile-meta">
            <span>
              <UserRound size={15} />
              {employee.employeeCode}
            </span>

            <span>
              <Mail size={15} />
              {employee.userId?.email || "No email"}
            </span>

            {employee.phone && (
              <span>
                <Phone size={15} />
                {employee.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="details-grid">
        {/* Personal Information */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <UserRound size={19} />
            </div>
            <div>
              <h2>Personal Information</h2>
              <p>Basic employee details</p>
            </div>
          </div>

          <div className="info-grid">
            <InfoItem
              label="First Name"
              value={employee.firstName}
            />

            <InfoItem
              label="Last Name"
              value={employee.lastName}
            />

            <InfoItem
              label="Phone"
              value={employee.phone}
            />

            <InfoItem
              label="Date of Birth"
              value={
                employee.dateOfBirth
                  ? formatDate(employee.dateOfBirth)
                  : undefined
              }
            />

            <InfoItem
              label="Gender"
              value={employee.gender}
            />
          </div>
        </section>

        {/* Job Information */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <Briefcase size={19} />
            </div>
            <div>
              <h2>Job Information</h2>
              <p>Employment details</p>
            </div>
          </div>

          <div className="info-grid">
            <InfoItem
              label="Employee Code"
              value={employee.employeeCode}
            />

            <InfoItem
              label="Designation"
              value={employee.designation}
            />

            <InfoItem
              label="Department"
              value={employee.departmentId?.name}
            />

            <InfoItem
              label="Employment Type"
              value={formatEmploymentType(employee.employmentType)}
            />

            <InfoItem
              label="Joining Date"
              value={formatDate(employee.joiningDate)}
            />

            <InfoItem
              label="Work Location"
              value={employee.workLocation}
            />

            <InfoItem
              label="Monthly Base Package"
              value={employee.monthlySalary ? `₹${employee.monthlySalary.toLocaleString()}/month` : "₹50,000/month"}
            />
          </div>
        </section>

        {/* Reporting */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <Building2 size={19} />
            </div>
            <div>
              <h2>Reporting & Organization</h2>
              <p>Department and reporting structure</p>
            </div>
          </div>

          <div className="info-grid">
            <InfoItem
              label="Department"
              value={
                employee.departmentId
                  ? `${employee.departmentId.name} (${employee.departmentId.code})`
                  : undefined
              }
            />

            <InfoItem
              label="Manager"
              value={
                employee.managerId
                  ? `${employee.managerId.firstName} ${
                      employee.managerId.lastName || ""
                    }`.trim()
                  : undefined
              }
            />

            <InfoItem
              label="Manager Designation"
              value={employee.managerId?.designation}
            />
          </div>
        </section>

        {/* Account */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2>Account Information</h2>
              <p>System access details</p>
            </div>
          </div>

          <div className="info-grid">
            <InfoItem
              label="Email"
              value={employee.userId?.email}
            />

            <InfoItem
              label="Role"
              value={employee.userId?.role}
            />

            <InfoItem
              label="Account Status"
              value={
                employee.userId?.isActive
                  ? "Active"
                  : "Inactive"
              }
            />

            <InfoItem
              label="Created"
              value={formatDate(employee.createdAt)}
            />
          </div>
        </section>
      </div>

      {/* Edit Employee Pop-up Modal */}
      <EditEmployeeModal
        employeeId={id || null}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadEmployee();
        }}
      />
    </div>
  );
};

interface InfoItemProps {
  label: string;
  value?: string;
}

const InfoItem = ({ label, value }: InfoItemProps) => {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
};

const formatDate = (date?: string) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatEmploymentType = (type?: string) => {
  if (!type) return "—";

  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default EmployeeDetails;