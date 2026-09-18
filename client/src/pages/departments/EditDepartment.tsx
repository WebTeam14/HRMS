import { ArrowLeft, Building2, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDepartment,
  updateDepartment,
  type Department,
} from "../../services/departmentService";
import { getEmployees, type Employee } from "../../services/employeeService";

const EditDepartment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      const [deptRes, empRes] = await Promise.all([
        getDepartment(id),
        getEmployees({ limit: 100, status: "ACTIVE" }),
      ]);

      const dept = deptRes.data;
      setDepartment(dept);
      setEmployees(empRes.data);

      setForm({
        name: dept.name,
        code: dept.code,
        description: dept.description || "",
        managerId:
          typeof dept.managerId === "object" && dept.managerId
            ? dept.managerId._id
            : (dept.managerId as unknown as string) || "",
        isActive: dept.isActive,
      });
    } catch (err: any) {
      console.error("Failed to load department data:", err);
      setError(
        err?.response?.data?.message || "Failed to load department."
      );
    } finally {
      setLoading(false);
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
      [name]:
        name === "code"
          ? value.toUpperCase().trim()
          : name === "isActive"
          ? value === "true"
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError("");

    if (!form.name.trim() || !form.code.trim()) {
      setError("Please fill all required fields (Name and Code).");
      return;
    }

    try {
      setSaving(true);
      await updateDepartment(id, {
        name: form.name.trim(),
        code: form.code.toUpperCase().trim(),
        description: form.description.trim(),
        managerId: form.managerId,
        isActive: form.isActive,
      });

      navigate(`/departments/${id}`, { replace: true });
    } catch (err: any) {
      console.error("Failed to update department:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to update department. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-form-page">
        <div className="page-loading">Loading department...</div>
      </div>
    );
  }

  if (!department && error) {
    return (
      <div className="employee-form-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/departments")}
        >
          <ArrowLeft size={16} />
          Back to Departments
        </button>
        <div className="form-error">{error}</div>
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
            onClick={() => navigate(`/departments/${id}`)}
          >
            <ArrowLeft size={16} />
            Back to Department Details
          </button>

          <h1>Edit Department</h1>
          <p>Update information and leadership for {department?.name}.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="employee-form">
        <section className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <Building2 size={18} />
            </div>
            <div>
              <h2>Department Details</h2>
              <p>Update department attributes.</p>
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
                value={form.code}
                onChange={handleChange}
                required
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="form-field">
              <label>Department Manager / Lead</label>
              <select
                name="managerId"
                value={form.managerId}
                onChange={handleChange}
              >
                <option value="">No manager assigned</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName || ""} — {emp.employeeCode}
                    {emp.designation ? ` (${emp.designation})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                name="isActive"
                value={form.isActive ? "true" : "false"}
                onChange={handleChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description of department responsibilities"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(`/departments/${id}`)}
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDepartment;
