import { ArrowLeft, Building2, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDepartment } from "../../services/departmentService";
import { getEmployees, type Employee } from "../../services/employeeService";

const AddDepartment = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
  });

  useEffect(() => {
    loadActiveEmployees();
  }, []);

  const loadActiveEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await getEmployees({
        limit: 100,
        status: "ACTIVE",
      });
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to load employees for manager selection:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase().trim() : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.code.trim()) {
      setError("Please fill all required fields (Name and Code).");
      return;
    }

    try {
      setLoading(true);
      await createDepartment({
        name: form.name.trim(),
        code: form.code.toUpperCase().trim(),
        description: form.description.trim() || undefined,
        managerId: form.managerId || undefined,
      });

      navigate("/departments", { replace: true });
    } catch (err: any) {
      console.error("Failed to create department:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to create department. Please check your inputs and try again."
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
            onClick={() => navigate("/departments")}
          >
            <ArrowLeft size={16} />
            Back to Departments
          </button>

          <h1>Add Department</h1>
          <p>Create a new organizational department and assign a department lead.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="employee-form">
        {/* Department Info */}
        <section className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <Building2 size={18} />
            </div>
            <div>
              <h2>Department Details</h2>
              <p>General information about the department.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>
                Department Name
                <span className="required">*</span>
              </label>
              <input
                name="name"
                placeholder="e.g. Engineering, Human Resources"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Department Code
                <span className="required">*</span>
              </label>
              <input
                name="code"
                placeholder="e.g. ENG, HR, FIN"
                value={form.code}
                onChange={handleChange}
                required
                style={{ textTransform: "uppercase" }}
              />
              <small>Unique short identifier in uppercase.</small>
            </div>

            <div className="form-field">
              <label>Department Manager / Lead</label>
              <select
                name="managerId"
                value={form.managerId}
                onChange={handleChange}
                disabled={loadingEmployees}
              >
                <option value="">Select department manager (optional)</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName || ""} — {emp.employeeCode}
                    {emp.designation ? ` (${emp.designation})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Description</label>
              <input
                name="description"
                placeholder="Brief description of department scope"
                value={form.description}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/departments")}
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
            {loading ? "Creating..." : "Create Department"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDepartment;
