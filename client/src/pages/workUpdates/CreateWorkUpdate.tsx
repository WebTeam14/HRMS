import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
} from "lucide-react";
import { createWorkUpdate } from "../../services/workUpdateService";
import type { WorkTaskPriority, WorkTaskStatus } from "../../types";

interface TaskInput {
  id: string;
  title: string;
  description: string;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  estimatedHours: number;
  actualHours: number;
}

const CreateWorkUpdate = () => {
  const navigate = useNavigate();

  // Get current date formatted in local timezone YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [summary, setSummary] = useState("");
  const [accomplishments, setAccomplishments] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextDayPlan, setNextDayPlan] = useState("");

  const [tasks, setTasks] = useState<TaskInput[]>([
    {
      id: "1",
      title: "",
      description: "",
      status: "COMPLETED",
      priority: "MEDIUM",
      estimatedHours: 2,
      actualHours: 2,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        title: "",
        description: "",
        status: "COMPLETED",
        priority: "MEDIUM",
        estimatedHours: 1,
        actualHours: 1,
      },
    ]);
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTaskField = (
    index: number,
    field: keyof TaskInput,
    value: any
  ) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const totalCalculatedHours = tasks.reduce(
    (sum, t) => sum + (Number(t.actualHours) || 0),
    0
  );

  const handleSubmit = async (submitStatus: "DRAFT" | "SUBMITTED") => {
    setError(null);

    if (!summary.trim()) {
      setError("Please provide a daily summary");
      return;
    }

    if (submitStatus === "SUBMITTED") {
      const validTasks = tasks.filter((t) => t.title.trim().length > 0);
      if (validTasks.length === 0) {
        setError("Please add at least one task with a title before submitting your update");
        return;
      }
    }

    const cleanedTasks = tasks
      .filter((t) => t.title.trim().length > 0)
      .map((t) => ({
        title: t.title.trim(),
        description: t.description.trim() || undefined,
        status: t.status,
        priority: t.priority,
        estimatedHours: Number(t.estimatedHours) || 0,
        actualHours: Number(t.actualHours) || 0,
      }));

    try {
      setSubmitting(true);
      await createWorkUpdate({
        date,
        summary: summary.trim(),
        accomplishments: accomplishments.trim() || undefined,
        blockers: blockers.trim() || undefined,
        nextDayPlan: nextDayPlan.trim() || undefined,
        totalHours: totalCalculatedHours,
        status: submitStatus,
        tasks: cleanedTasks,
      });

      navigate("/my-work-updates");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.details?.[0]?.message ||
          "Failed to save work update"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employees-page" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/my-work-updates")}
            style={{ marginBottom: "12px" }}
          >
            <ArrowLeft size={16} />
            Back to My Work Updates
          </button>
          <h1>Create Daily Work Update</h1>
          <p>Record your activities, accomplished milestones, and task breakdown.</p>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Overview Card */}
        <div
          className="details-card"
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginBottom: "20px" }}>
            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Update Date *
              </label>
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Daily Summary *
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="High-level overview of what you worked on today..."
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Accomplishments & Key Results
              </label>
              <textarea
                rows={3}
                value={accomplishments}
                onChange={(e) => setAccomplishments(e.target.value)}
                placeholder="Key deliverables completed, PRs merged, bugs resolved..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Blockers / Issues
              </label>
              <textarea
                rows={3}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Any dependencies, blockers, or assistance needed..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                Plan for Tomorrow
              </label>
              <textarea
                rows={2}
                value={nextDayPlan}
                onChange={(e) => setNextDayPlan(e.target.value)}
                placeholder="Priorities planned for the next working day..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Section Card */}
        <div
          className="details-card"
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                Tasks & Activities
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                Break down individual tasks, priorities, and actual hours spent.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "6px 12px", borderRadius: "6px" }}>
                Total: {totalCalculatedHours} hrs
              </span>

              <button
                type="button"
                className="secondary-button"
                onClick={addTask}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                <Plus size={14} />
                Add Task
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "3fr 1.2fr 1.2fr 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder={`Task ${idx + 1} Title *`}
                    value={task.title}
                    onChange={(e) => updateTaskField(idx, "title", e.target.value)}
                    required
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "13px",
                      background: "white",
                    }}
                  />

                  <select
                    value={task.status}
                    onChange={(e) => updateTaskField(idx, "status", e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "12px",
                      background: "white",
                    }}
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PENDING">Pending</option>
                  </select>

                  <select
                    value={task.priority}
                    onChange={(e) => updateTaskField(idx, "priority", e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "12px",
                      background: "white",
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>

                  <div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      title="Estimated Hours"
                      placeholder="Est hrs"
                      value={task.estimatedHours}
                      onChange={(e) => updateTaskField(idx, "estimatedHours", parseFloat(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 6px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12px",
                        background: "white",
                      }}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      title="Actual Hours"
                      placeholder="Act hrs"
                      value={task.actualHours}
                      onChange={(e) => updateTaskField(idx, "actualHours", parseFloat(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "8px 6px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12px",
                        background: "white",
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  {tasks.length > 1 && (
                    <button
                      type="button"
                      className="table-action-button"
                      style={{ color: "#dc2626" }}
                      onClick={() => removeTask(idx)}
                      title="Remove Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Task Description / Details (optional)"
                  value={task.description}
                  onChange={(e) => updateTaskField(idx, "description", e.target.value)}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "12px",
                    background: "white",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => handleSubmit("DRAFT")}
            disabled={submitting}
          >
            <Save size={16} />
            Save as Draft
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => handleSubmit("SUBMITTED")}
            disabled={submitting}
          >
            <Send size={16} />
            {submitting ? "Submitting..." : "Submit Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkUpdate;
