import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import {
  getMyWorkUpdate,
  updateWorkUpdate,
  submitWorkUpdate,
  createTask,
  updateTask,
  deleteTask,
} from "../../services/workUpdateService";
import type { WorkTask, WorkTaskPriority, WorkTaskStatus, WorkUpdate } from "../../types";

const EditWorkUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [update, setUpdate] = useState<WorkUpdate | null>(null);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [accomplishments, setAccomplishments] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextDayPlan, setNextDayPlan] = useState("");

  // New task form inputs
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<WorkTaskStatus>("COMPLETED");
  const [newTaskPriority, setNewTaskPriority] = useState<WorkTaskPriority>("MEDIUM");
  const [newTaskEstHours, setNewTaskEstHours] = useState<number>(1);
  const [newTaskActHours, setNewTaskActHours] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [taskActionLoading, setTaskActionLoading] = useState(false);

  const loadDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getMyWorkUpdate(id);
      const u = res.data;
      setUpdate(u);
      setDate(u.date ? u.date.split("T")[0] : "");
      setSummary(u.summary || "");
      setAccomplishments(u.accomplishments || "");
      setBlockers(u.blockers || "");
      setNextDayPlan(u.nextDayPlan || "");
      setTasks(u.tasks || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load work update");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTaskTitle.trim()) return;

    try {
      setTaskActionLoading(true);
      await createTask(id, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
        status: newTaskStatus,
        priority: newTaskPriority,
        estimatedHours: Number(newTaskEstHours) || 0,
        actualHours: Number(newTaskActHours) || 0,
      });

      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskEstHours(1);
      setNewTaskActHours(1);
      await loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add task");
    } finally {
      setTaskActionLoading(false);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    field: keyof WorkTask,
    value: any
  ) => {
    if (!id) return;
    try {
      await updateTask(id, taskId, { [field]: value });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, [field]: value } : t))
      );
    } catch (err: any) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!id) return;
    try {
      await deleteTask(id, taskId);
      await loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete task");
    }
  };

  const handleSave = async (submitNow: boolean = false) => {
    if (!id) return;
    setError(null);

    if (!summary.trim()) {
      setError("Summary is required");
      return;
    }

    try {
      setSubmitting(true);
      await updateWorkUpdate(id, {
        date,
        summary: summary.trim(),
        accomplishments: accomplishments.trim() || undefined,
        blockers: blockers.trim() || undefined,
        nextDayPlan: nextDayPlan.trim() || undefined,
      });

      if (submitNow) {
        if (tasks.length === 0) {
          setError("Please add at least one task before submitting");
          setSubmitting(false);
          return;
        }
        await submitWorkUpdate(id);
      }

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

  const totalCalculatedHours = tasks.reduce(
    (sum, t) => sum + (Number(t.actualHours) || 0),
    0
  );

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
          <h1>Edit Daily Work Update</h1>
          <p>Update your activities or address manager feedback.</p>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Changes Requested Banner */}
      {update?.status === "CHANGES_REQUESTED" && update.managerComment && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <MessageSquare size={20} color="#d97706" style={{ marginTop: "2px" }} />
          <div>
            <strong style={{ color: "#92400e", fontSize: "14px", display: "block" }}>
              Manager Feedback: Changes Requested
            </strong>
            <p style={{ margin: "4px 0 0", color: "#b45309", fontSize: "13px" }}>
              {update.managerComment}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading update details...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Overview Card */}
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginBottom: "20px" }}>
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Update Date *
                </label>
                <input
                  type="date"
                  value={date}
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
                  Accomplishments
                </label>
                <textarea
                  rows={3}
                  value={accomplishments}
                  onChange={(e) => setAccomplishments(e.target.value)}
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
          <div className="details-card" style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                  Tasks ({tasks.length})
                </h3>
                <small style={{ color: "#64748b" }}>Total logged: {totalCalculatedHours} hrs</small>
              </div>
            </div>

            {/* Existing Tasks List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {tasks.map((task) => (
                <div
                  key={task._id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "grid",
                    gridTemplateColumns: "3fr 1.2fr 1.2fr 1fr auto",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleUpdateTask(task._id, "title", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    />
                    {task.description && (
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {task.description}
                      </div>
                    )}
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateTask(task._id, "status", e.target.value)}
                    style={{
                      padding: "6px",
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
                    onChange={(e) => handleUpdateTask(task._id, "priority", e.target.value)}
                    style={{
                      padding: "6px",
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

                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={task.actualHours}
                    onChange={(e) =>
                      handleUpdateTask(task._id, "actualHours", parseFloat(e.target.value) || 0)
                    }
                    style={{
                      width: "70px",
                      padding: "6px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  />

                  <button
                    type="button"
                    className="table-action-button"
                    style={{ color: "#dc2626" }}
                    onClick={() => handleDeleteTask(task._id)}
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline Add Task Form */}
            <form
              onSubmit={handleAddTask}
              style={{
                background: "#eff6ff",
                border: "1px dashed #93c5fd",
                borderRadius: "8px",
                padding: "14px",
                display: "grid",
                gridTemplateColumns: "3fr 1.2fr 1.2fr 1fr auto",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="New Task Title *"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
                style={{
                  padding: "8px 10px",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  fontSize: "13px",
                  background: "white",
                }}
              />

              <select
                value={newTaskStatus}
                onChange={(e) => setNewTaskStatus(e.target.value as WorkTaskStatus)}
                style={{
                  padding: "8px",
                  border: "1px solid #bfdbfe",
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
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as WorkTaskPriority)}
                style={{
                  padding: "8px",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  fontSize: "12px",
                  background: "white",
                }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>

              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="Actual hrs"
                value={newTaskActHours}
                onChange={(e) => setNewTaskActHours(parseFloat(e.target.value) || 0)}
                style={{
                  width: "70px",
                  padding: "8px",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  fontSize: "12px",
                  background: "white",
                }}
              />

              <button
                type="submit"
                className="primary-button"
                style={{ padding: "8px 14px", fontSize: "12px" }}
                disabled={taskActionLoading || !newTaskTitle.trim()}
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleSave(false)}
              disabled={submitting}
            >
              <Save size={16} />
              Save Changes
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => handleSave(true)}
              disabled={submitting}
            >
              <Send size={16} />
              {submitting ? "Submitting..." : update?.status === "CHANGES_REQUESTED" ? "Resubmit Update" : "Submit Update"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditWorkUpdate;
