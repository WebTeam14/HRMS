import {
  ArrowLeft,
  UserPlus,
  Save,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createEmployee,
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

const AddEmployee = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",

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
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        getDepartments({ limit: 100, status: "ACTIVE" }),
        getEmployees({ limit: 100, status: "ACTIVE" }),
      ]);
      setDepartments(deptRes.data);
      setManagers(empRes.data);
    } catch (err) {
      console.error("Failed to load departments/managers:", err);
    }
  };

  const handleDepartmentChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedDeptId = e.target.value;
    setForm((prev) => ({
      ...prev,
      departmentId: selectedDeptId,
      designation: "", // reset designation when department changes
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
      console.error("Failed to load designations for department:", err);
      setDesignations([]);
    } finally {
      setLoadingDesignations(false);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");

    if (
      !form.firstName.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.joiningDate
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        password: form.password,

        firstName: form.firstName.trim(),

        joiningDate: form.joiningDate,

        employmentType: form.employmentType,
      };

      if (form.lastName.trim()) {
        payload.lastName = form.lastName.trim();
      }

      if (form.phone.trim()) {
        payload.phone = form.phone.trim();
      }

      if (form.dateOfBirth) {
        payload.dateOfBirth = form.dateOfBirth;
      }

      if (form.gender) {
        payload.gender = form.gender;
      }

      if (form.departmentId) {
        payload.departmentId = form.departmentId;
      }

      if (form.managerId) {
        payload.managerId = form.managerId;
      }

      if (form.designation.trim()) {
        payload.designation = form.designation.trim();
      }

      if (form.workLocation.trim()) {
        payload.workLocation = form.workLocation.trim();
      }

      if (form.monthlySalary) {
        payload.monthlySalary = Number(form.monthlySalary) || 50000;
      }

      await createEmployee(payload);

      navigate("/employees", {
        replace: true,
      });
    } catch (error: any) {
      console.error("Failed to create employee:", error);

      setError(
        error?.response?.data?.message ||
          "Unable to create employee. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-form-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/employees")}
          >
            <ArrowLeft size={16} />
            Back to Employees
          </button>

          <h1>Add Employee</h1>

          <p>
            Create a new employee account and employment record.
          </p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="employee-form">
        {/* Account Information */}
        <section className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <UserPlus size={18} />
            </div>

            <div>
              <h2>Account Information</h2>
              <p>Login credentials for the employee.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>
                Email
                <span className="required">*</span>
              </label>

              <input
                name="email"
                type="email"
                placeholder="employee@company.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Initial Password
                <span className="required">*</span>
              </label>

              <input
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <UserPlus size={18} />
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Basic employee information.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>
                First Name
                <span className="required">*</span>
              </label>

              <input
                name="firstName"
                placeholder="First name"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Last Name</label>

              <input
                name="lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Phone</label>

              <input
                name="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
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

            <div className="form-field">
              <label>Gender</label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
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
            <div className="form-section-icon">
              <UserPlus size={18} />
            </div>

            <div>
              <h2>Employment Information</h2>
              <p>Organization and job details.</p>
            </div>
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
                <option value="">Select manager (optional)</option>
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
                  {designations.map((desig) => (
                    <option key={desig._id} value={desig.name}>
                      {desig.name}
                      {desig.code ? ` (${desig.code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-field">
              <label>
                Joining Date
                <span className="required">*</span>
              </label>

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
                placeholder="e.g. Mumbai Office"
                value={form.workLocation}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>
                Monthly Base Package / Salary (₹)
                <span className="required">*</span>
              </label>

              <input
                name="monthlySalary"
                type="number"
                placeholder="50000"
                value={form.monthlySalary}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/employees")}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? "Creating..." : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;