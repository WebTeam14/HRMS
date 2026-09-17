import { ArrowLeft, Briefcase, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDesignation,
  updateDesignation,
  type Designation,
} from "../../services/designationService";
import {
  getDepartments,
  type Department,
} from "../../services/departmentService";

const EditDesignation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [designation, setDesignation] = useState<Designation | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    description: "",
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

      const [desigRes, deptRes] = await Promise.all([
        getDesignation(id),
        getDepartments({ limit: 100, status: "ACTIVE" }),
      ]);

      const desig = desigRes.data;
      setDesignation(desig);
      setDepartments(deptRes.data);

      setForm({
        name: desig.name,
        code: desig.code || "",
        departmentId:
          typeof desig.departmentId === "object" && desig.departmentId
            ? desig.departmentId._id
            : (desig.departmentId as unknown as string) || "",
        description: desig.description || "",
        isActive: desig.isActive,
      });
    } catch (err: any) {
      console.error("Failed to load designation data:", err);
      setError(
        err?.response?.data?.message || "Failed to load designation."
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

    if (!form.name.trim()) {
      setError("Designation name is required.");
      return;
    }

    try {
      setSaving(true);
      await updateDesignation(id, {
        name: form.name.trim(),
        code: form.code.toUpperCase().trim() || undefined,
        departmentId: form.departmentId || "",
        description: form.description.trim(),
        isActive: form.isActive,
      });

      navigate("/designations", { replace: true });
    } catch (err: any) {
      console.error("Failed to update designation:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to update designation. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-form-page">
        <div className="page-loading">Loading designation...</div>
      </div>
    );
  }

  if (!designation && error) {
    return (
      <div className="employee-form-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/designations")}
        >
          <ArrowLeft size={16} />
          Back to Designations
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
            onClick={() => navigate("/designations")}
          >
            <ArrowLeft size={16} />
            Back to Designations
          </button>

          <h1>Edit Designation</h1>
          <p>Update designation details for {designation?.name}.</p>
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
              <h2>Designation Details</h2>
              <p>Update job title and department association.</p>
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
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Designation Code</label>
              <input
                name="code"
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
                placeholder="Description of role and responsibilities"
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

export default EditDesignation;
