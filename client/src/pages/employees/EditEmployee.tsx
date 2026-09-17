import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

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

const EditEmployee = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);

  const [loading, setLoading] = useState(true);
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
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      if (!id) return;

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
        monthlySalary: data.monthlySalary !== undefined ? String(data.monthlySalary) : "50000",
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
        err?.response?.data?.message || "Failed to load employee."
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      setSaving(true);
      setError("");

      const payload: Record<string, unknown> = {};

      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined) {
          payload[key] = value;
        }
      });

      await updateEmployee(id, payload);

      navigate(`/employees/${id}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to update employee."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-form-page">
        <div className="page-loading">
          Loading employee...
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="employee-form-page">
        <div className="error-card">
          {error || "Employee not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="employee-form-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(`/employees/${id}`)}
          >
            <ArrowLeft size={16} />
            Back to Employee Details
          </button>

          <h1>Edit Employee</h1>
          <p>
            Update information for {employee.firstName}{" "}
            {employee.lastName || ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <form
        className="employee-form"
        onSubmit={handleSubmit}
      >
        {/* Personal Information */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Personal Information</h2>
            <p>Employee's basic information</p>
          </div>

          <div className="form-grid">
            <FormField
              label="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />

            <FormField
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />

            <FormField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

            <FormField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange}
            />

            <div className="form-field">
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
        </section>

        {/* Employment Information */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Employment Information</h2>
            <p>Employee's job and organization details</p>
          </div>

          <div className="form-grid">
            {/* Department Dropdown */}
            <div className="form-field">
              <label>Department</label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleDepartmentChange}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Manager Dropdown */}
            <div className="form-field">
              <label>Manager</label>
              <select
                name="managerId"
                value={form.managerId}
                onChange={handleChange}
              >
                <option value="">No manager assigned</option>
                {managers.map((mgr) => (
                  <option key={mgr._id} value={mgr._id}>
                    {mgr.firstName} {mgr.lastName || ""} — {mgr.employeeCode}
                    {mgr.designation ? ` — ${mgr.designation}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Designation Dropdown */}
            <div className="form-field">
              <label>Designation</label>
              {!form.departmentId ? (
                <select disabled>
                  <option value="">Select department first</option>
                </select>
              ) : loadingDesignations ? (
                <select disabled>
                  <option value="">Loading designations...</option>
                </select>
              ) : designations.length === 0 ? (
                <select disabled>
                  <option value="">No designations available</option>
                </select>
              ) : (
                <select
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                >
                  <option value="">Select designation</option>
                  {/* Also ensure current designation is visible even if not in list */}
                  {form.designation &&
                    !designations.some(
                      (d) => d.name === form.designation
                    ) && (
                      <option value={form.designation}>
                        {form.designation} (Current)
                      </option>
                    )}
                  {designations.map((desig) => (
                    <option key={desig._id} value={desig.name}>
                      {desig.name}
                      {desig.code ? ` (${desig.code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <FormField
              label="Joining Date"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={handleChange}
              required
            />

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

            <FormField
              label="Work Location"
              name="workLocation"
              value={form.workLocation}
              onChange={handleChange}
            />

            <FormField
              label="Monthly Base Package / Salary (₹)"
              name="monthlySalary"
              type="number"
              value={form.monthlySalary}
              onChange={handleChange}
              required
            />
          </div>
        </section>

        {/* Account Information */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Account Information</h2>
            <p>Account credentials cannot be changed here</p>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Email</label>
              <input
                value={
                  typeof employee.userId === "object"
                    ? employee.userId?.email || ""
                    : ""
                }
                disabled
              />
            </div>

            <div className="form-field">
              <label>Employee Code</label>
              <input
                value={employee.employeeCode}
                disabled
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="employee-form-actions">
          <button
            type="button"
            className="form-cancel-button"
            onClick={() =>
              navigate(`/employees/${id}`)
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className="form-submit-button"
            disabled={saving}
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => void;
}

const FormField = ({
  label,
  name,
  value,
  type = "text",
  required = false,
  onChange,
}: FormFieldProps) => {
  return (
    <div className="form-field">
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default EditEmployee;