import { ArrowLeft, Briefcase, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDesignation } from "../../services/designationService";
import {
  getDepartments,
  type Department,
} from "../../services/departmentService";

const AddDesignation = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    description: "",
  });

  useEffect(() => {
    loadActiveDepartments();
  }, []);

  const loadActiveDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const res = await getDepartments({
        limit: 100,
        status: "ACTIVE",
      });
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoadingDepartments(false);
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

    if (!form.name.trim()) {
      setError("Designation name is required.");
      return;
    }

    try {
      setLoading(true);
      await createDesignation({
        name: form.name.trim(),
        code: form.code.toUpperCase().trim() || undefined,
        departmentId: form.departmentId || undefined,
        description: form.description.trim() || undefined,
      });

      navigate("/designations", { replace: true });
    } catch (err: any) {
      console.error("Failed to create designation:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to create designation. Please check inputs and try again."
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
            onClick={() => navigate("/designations")}
          >
            <ArrowLeft size={16} />
            Back to Designations
          </button>

          <h1>Add Designation</h1>
          <p>Create a job role or position attached to a department.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="employee-form">
        <section className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <Briefcase size={18} />
            </div>
            <div>
              <h2>Designation Information</h2>
              <p>Position title and organizational department.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>
                Designation Name
                <span className="required">*</span>
              </label>
              <input
                name="name"
                placeholder="e.g. Senior Software Engineer, HR Manager"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Designation Code</label>
              <input
                name="code"
                placeholder="e.g. SSE, HRM (optional)"
                value={form.code}
                onChange={handleChange}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="form-field">
              <label>Department</label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                disabled={loadingDepartments}
              >
                <option value="">Select Department (Optional / General)</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Description</label>
              <input
                name="description"
                placeholder="Responsibilities or level description"
                value={form.description}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/designations")}
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
            {loading ? "Creating..." : "Create Designation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDesignation;
