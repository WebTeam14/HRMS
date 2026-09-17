import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X, Save, UserCheck } from "lucide-react";

import {
  getEmployee,
  updateEmployee,
  getEmployees,
  type Employee,
} from "../../services/employeeService";

import {
  getDepartments,
  type Department,
} from "../../services/departmentService";

import {
  getDesignations,
  type Designation,
} from "../../services/designationService";

interface EditEmployeeModalProps {
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditEmployeeModal = ({
  employeeId,
  isOpen,
  onClose,
  onSuccess,
}: EditEmployeeModalProps) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    departmentId: "",
    managerId: "",
    designation: "",
    joiningDate: "",
    employmentType: "FULL_TIME",
    workLocation: "",
    monthlySalary: "50000",
  });

  useEffect(() => {
    if (isOpen && employeeId) {
      loadInitialData(employeeId);
    }
  }, [isOpen, employeeId]);

  const loadInitialData = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      const [empRes, deptRes, mgrRes] = await Promise.all([
        getEmployee(id),
        getDepartments({ limit: 100, status: "ACTIVE" }),
        getEmployees({ limit: 100, status: "ACTIVE" }),
      ]);

      const data: Employee = empRes.data;
      setEmployee(data);
      setDepartments(deptRes.data);
      setManagers(mgrRes.data.filter((m) => m._id !== id));

      const rawDeptId =
        typeof data.departmentId === "object" && data.departmentId
          ? data.departmentId._id
          : (data.departmentId as unknown as string) || "";

      const rawMgrId =
        typeof data.managerId === "object" && data.managerId
          ? data.managerId._id
          : (data.managerId as unknown as string) || "";

      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        dateOfBirth: data.dateOfBirth
          ? data.dateOfBirth.substring(0, 10)
          : "",
        gender: data.gender || "",
        departmentId: rawDeptId,
        managerId: rawMgrId,
        designation: data.designation || "",
        joiningDate: data.joiningDate
          ? data.joiningDate.substring(0, 10)
          : "",
        employmentType: data.employmentType || "FULL_TIME",
        workLocation: data.workLocation || "",
        monthlySalary:
          data.monthlySalary !== undefined
            ? String(data.monthlySalary)
            : "50000",
      });

      if (rawDeptId) {
        try {
          const desigRes = await getDesignations({
            departmentId: rawDeptId,
            status: "ACTIVE",
            limit: 100,
          });
          setDesignations(desigRes.data);
        } catch (desigErr) {
          console.error("Failed to load designations for department:", desigErr);
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load employee details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedDeptId = e.target.value;
    setForm((prev) => ({
      ...prev,
      departmentId: selectedDeptId,
      designation: "",
    }));

    if (!selectedDeptId) {
      setDesignations([]);
      return;
    }

    try {
      setLoadingDesignations(true);
      const res = await getDesignations({
        departmentId: selectedDeptId,
        status: "ACTIVE",
        limit: 100,
      });
      setDesignations(res.data);
    } catch (err) {
      console.error("Failed to load designations:", err);
      setDesignations([]);
    } finally {
      setLoadingDesignations(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    try {
      setSaving(true);
      setError("");

      const payload: Record<string, unknown> = {};

      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === "monthlySalary") {
            payload[key] = Number(value) || 0;
          } else {
            payload[key] = value;
          }
        }
      });

      await updateEmployee(employeeId, payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to update employee details."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal"
        style={{
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "16px",
          padding: "28px",
          background: "white",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                Edit Employee Details
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                {employee
                  ? `${employee.firstName} ${employee.lastName || ""} (${employee.employeeCode})`
                  : "Loading details..."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
            Loading employee record...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 1. Personal Information */}
            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Personal Information
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div className="form-field">
                  <label>First Name *</label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Last Name</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field">
                  <label>Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field" style={{ gridColumn: "span 2" }}>
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Employment & Compensation */}
            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Employment & Package (Increments)
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div className="form-field">
                  <label>Department</label>
                  <select
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleDepartmentChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Reporting Manager</label>
                  <select
                    name="managerId"
                    value={form.managerId}
                    onChange={handleChange}
                  >
                    <option value="">No Manager Assigned</option>
                    {managers.map((mgr) => (
                      <option key={mgr._id} value={mgr._id}>
                        {mgr.firstName} {mgr.lastName || ""} ({mgr.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Designation</label>
                  {!form.departmentId ? (
                    <select disabled>
                      <option value="">Select Department First</option>
                    </select>
                  ) : loadingDesignations ? (
                    <select disabled>
                      <option value="">Loading Designations...</option>
                    </select>
                  ) : (
                    <select
                      name="designation"
                      value={form.designation}
                      onChange={handleChange}
                    >
                      <option value="">Select Designation</option>
                      {form.designation &&
                        !designations.some((d) => d.name === form.designation) && (
                          <option value={form.designation}>
                            {form.designation} (Current)
                          </option>
                        )}
                      {designations.map((desig) => (
                        <option key={desig._id} value={desig.name}>
                          {desig.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-field">
                  <label>Joining Date *</label>
                  <input
                    name="joiningDate"
                    type="date"
                    value={form.joiningDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Employment Type</label>
                  <select
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleChange}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Work Location</label>
                  <input
                    name="workLocation"
                    value={form.workLocation}
                    onChange={handleChange}
                  />
                </div>

                {/* Base Package / Salary Increment Field */}
                <div className="form-field" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 700, color: "#2563eb" }}>
                    Monthly Base Package / Salary (₹) [Salary Increment] *
                  </label>
                  <input
                    name="monthlySalary"
                    type="number"
                    value={form.monthlySalary}
                    onChange={handleChange}
                    required
                    style={{
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "#1e40af",
                      borderColor: "#93c5fd",
                      background: "#eff6ff",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "16px",
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Save size={16} />
                {saving ? "Saving Changes..." : "Save Employee Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
