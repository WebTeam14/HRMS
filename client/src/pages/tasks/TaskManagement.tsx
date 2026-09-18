import { useEffect, useState } from "react";
import {
  Plus, AlertTriangle, Clock, CheckCircle2, ListTodo,
  Trash2, Edit2, X, Calendar, Zap,
  Search,
} from "lucide-react";
import {
  getTeamTasks, createTask, updateTaskStatus, updateTask,
  deleteTask, getTeamMembers, type Task, type TaskStatus,
  type TaskPriority, type TaskEmployee, type TaskStats,
} from "../../services/taskService";

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  LOW:    { label: "Low",    color: "#64748b", bg: "#f1f5f9" },
  MEDIUM: { label: "Medium", color: "#d97706", bg: "#fef3c7" },
  HIGH:   { label: "High",   color: "#dc2626", bg: "#fef2f2" },
  URGENT: { label: "Urgent", color: "#fff",    bg: "#dc2626" },
};

const STATUS_COLUMNS: { key: TaskStatus; label: string; icon: any; color: string; border: string }[] = [
  { key: "TODO",        label: "To Do",       icon: ListTodo,      color: "#64748b", border: "#e2e8f0" },
  { key: "IN_PROGRESS", label: "In Progress", icon: Clock,         color: "#2563eb", border: "#bfdbfe" },
  { key: "COMPLETED",   label: "Completed",   icon: CheckCircle2,  color: "#059669", border: "#a7f3d0" },
  { key: "OVERDUE",     label: "Overdue",     icon: AlertTriangle, color: "#dc2626", border: "#fecaca" },
];

const TaskManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, overdue: 0, inProgress: 0, todo: 0 });
  const [members, setMembers] = useState<TaskEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Form
  const [form, setForm] = useState({
    title: "", description: "", assigneeId: "",
    priority: "MEDIUM" as TaskPriority,
    dueDate: "", estimatedHours: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterAssignee) params.assigneeId = filterAssignee;
      const res = await getTeamTasks(params);
      setTasks(res.data.data);
      setStats(res.data.stats);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTeamMembers().then((r) => setMembers(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filterStatus, filterPriority, filterAssignee]);

  const filtered = tasks.filter((t) =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    `${t.employeeId.firstName} ${t.employeeId.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = (s: TaskStatus) => filtered.filter((t) => t.status === s);

  const handleSubmitTask = async () => {
    setFormError("");
    if (!form.title.trim()) { setFormError("Task title is required"); return; }
    if (!form.assigneeId) { setFormError("Please select an assignee"); return; }
    try {
      setSubmitting(true);
      if (editTask) {
        await updateTask(editTask._id, {
          title: form.title, description: form.description,
          priority: form.priority,
          dueDate: form.dueDate || undefined,
          estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
          assigneeId: form.assigneeId,
        });
      } else {
        await createTask({
          title: form.title, description: form.description,
          assigneeId: form.assigneeId, priority: form.priority,
          dueDate: form.dueDate || undefined,
          estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        });
      }
      setShowAssignModal(false);
      setEditTask(null);
      resetForm();
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTaskStatus(taskId, status);
    load();
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(taskId);
    load();
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      assigneeId: task.employeeId._id,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
      estimatedHours: task.estimatedHours ? String(task.estimatedHours) : "",
    });
    setShowAssignModal(true);
  };

  const resetForm = () =>
    setForm({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "", estimatedHours: "" });

  const isOverdue = (t: Task) => t.status === "OVERDUE";
  const isDueToday = (t: Task) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    const today = new Date();
    return d.toDateString() === today.toDateString() && t.status !== "COMPLETED";
  };

  return (
    <div style={{ padding: "0" }}>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1>Team Task Board</h1>
          <p>Assign and track tasks across your team in real time</p>
        </div>
        <button
          className="primary-button"
          onClick={() => { resetForm(); setEditTask(null); setShowAssignModal(true); }}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> Assign Task
        </button>
      </div>

      {/* Alert Banner */}
      {(stats.overdue > 0 || stats.todo > 0) && (
        <div style={{
          display: "flex", gap: "12px", marginBottom: "18px",
          flexWrap: "wrap",
        }}>
          {stats.overdue > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "10px",
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", fontWeight: 600, fontSize: "13px",
            }}>
              <AlertTriangle size={15} />
              {stats.overdue} task{stats.overdue > 1 ? "s" : ""} overdue — action needed
            </div>
          )}
          {stats.todo > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "10px",
              background: "#fffbeb", border: "1px solid #fde68a",
              color: "#92400e", fontWeight: 600, fontSize: "13px",
            }}>
              <Clock size={15} />
              {stats.todo} task{stats.todo > 1 ? "s" : ""} not yet started
            </div>
          )}
          {stats.inProgress > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "10px",
              background: "#eff6ff", border: "1px solid #bfdbfe",
              color: "#1d4ed8", fontWeight: 600, fontSize: "13px",
            }}>
              <Zap size={15} />
              {stats.inProgress} in progress
            </div>
          )}
          {stats.completed > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "10px",
              background: "#f0fdf4", border: "1px solid #a7f3d0",
              color: "#065f46", fontWeight: 600, fontSize: "13px",
            }}>
              <CheckCircle2 size={15} />
              {stats.completed} completed
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
        padding: "14px 18px", marginBottom: "22px",
        display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px",
          background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "7px 12px" }}>
          <Search size={14} color="#64748b" />
          <input type="text" placeholder="Search tasks or members..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", width: "100%" }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" }}>
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" }}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" }}>
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.firstName} {m.lastName || ""}
            </option>
          ))}
        </select>
        {(filterStatus || filterPriority || filterAssignee || search) && (
          <button onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterAssignee(""); setSearch(""); }}
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1",
              background: "white", fontSize: "13px", cursor: "pointer", color: "#64748b" }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "14px", background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "10px", color: "#dc2626", marginBottom: "20px" }}>{error}</div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading team tasks...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
          {STATUS_COLUMNS.map((col) => {
            const colTasks = byStatus(col.key);
            const Icon = col.icon;
            return (
              <div key={col.key} style={{
                background: "#f8fafc", borderRadius: "14px",
                border: `2px solid ${col.border}`, minHeight: "200px",
              }}>
                {/* Column Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderBottom: `1px solid ${col.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon size={16} color={col.color} />
                    <span style={{ fontWeight: 700, fontSize: "14px", color: col.color }}>{col.label}</span>
                  </div>
                  <span style={{
                    background: col.color === "#dc2626" ? "#fef2f2" : "#f1f5f9",
                    color: col.color, borderRadius: "12px", padding: "2px 9px",
                    fontSize: "12px", fontWeight: 700,
                  }}>{colTasks.length}</span>
                </div>

                {/* Cards */}
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {colTasks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#cbd5e1", fontSize: "13px" }}>
                      No tasks
                    </div>
                  ) : colTasks.map((task) => {
                    const pm = PRIORITY_META[task.priority];
                    const assignee = task.employeeId;
                    const initial = assignee.firstName.charAt(0).toUpperCase();
                    const overdue = isOverdue(task);
                    const dueToday = isDueToday(task);

                    return (
                      <div key={task._id} style={{
                        background: "white", borderRadius: "10px", padding: "14px",
                        border: overdue ? "1.5px solid #fca5a5" : dueToday ? "1.5px solid #fcd34d" : "1px solid #e2e8f0",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        transition: "box-shadow 0.2s",
                      }}>
                        {/* Priority badge + actions */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
                            background: pm.bg, color: pm.color, letterSpacing: "0.04em", textTransform: "uppercase",
                          }}>{pm.label}</span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={() => openEdit(task)} title="Edit task"
                              style={{ border: "none", background: "transparent", cursor: "pointer", padding: "3px", borderRadius: "4px", color: "#64748b" }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(task._id)} title="Delete task"
                              style={{ border: "none", background: "transparent", cursor: "pointer", padding: "3px", borderRadius: "4px", color: "#ef4444" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: "13px", color: "#0f172a", lineHeight: 1.4 }}>
                          {task.title}
                        </p>

                        {task.description && (
                          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                            {task.description.length > 80 ? task.description.substring(0, 80) + "..." : task.description}
                          </p>
                        )}

                        {/* Due date */}
                        {task.dueDate && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px",
                            fontSize: "11px", color: overdue ? "#dc2626" : dueToday ? "#d97706" : "#64748b",
                            fontWeight: overdue || dueToday ? 700 : 400,
                          }}>
                            <Calendar size={11} />
                            {overdue ? "⚠ Overdue: " : dueToday ? "⏰ Due today: " : "Due: "}
                            {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        )}

                        {/* Assignee */}
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                          <div style={{
                            width: "22px", height: "22px", borderRadius: "50%",
                            background: "#172033", color: "white",
                            fontSize: "10px", fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>{initial}</div>
                          <span style={{ fontSize: "12px", color: "#334155", fontWeight: 500 }}>
                            {assignee.firstName} {assignee.lastName || ""}
                          </span>
                        </div>

                        {/* Quick status change */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value as TaskStatus)}
                          style={{
                            width: "100%", padding: "5px 8px", borderRadius: "6px",
                            border: "1px solid #e2e8f0", fontSize: "11px",
                            background: "#f8fafc", cursor: "pointer",
                          }}
                        >
                          <option value="TODO">📋 To Do</option>
                          <option value="IN_PROGRESS">🔄 In Progress</option>
                          <option value="COMPLETED">✅ Completed</option>
                          <option value="OVERDUE">🚨 Overdue</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign / Edit Task Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => { setShowAssignModal(false); setEditTask(null); resetForm(); }}>
          <div className="modal" style={{ maxWidth: "520px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                {editTask ? "Edit Task" : "Assign New Task"}
              </h3>
              <button onClick={() => { setShowAssignModal(false); setEditTask(null); resetForm(); }}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "8px", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Task Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="text" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Fix login page bug"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                    fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Assign To <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select value={form.assigneeId}
                  onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                    fontSize: "14px", background: "white", boxSizing: "border-box" }}>
                  <option value="">Select team member</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName || ""} — {m.designation || m.employeeCode}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                    Priority
                  </label>
                  <select value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                      fontSize: "14px", background: "white" }}>
                    <option value="LOW">🟢 Low</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HIGH">🔴 High</option>
                    <option value="URGENT">🚨 Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                    Due Date
                  </label>
                  <input type="date" value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                      fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Description
                </label>
                <textarea value={form.description} rows={3}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Task details, requirements, or notes..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                    fontSize: "14px", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Estimated Hours
                </label>
                <input type="number" value={form.estimatedHours} min={0}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
                  placeholder="e.g. 4"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1",
                    fontSize: "14px", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button onClick={() => { setShowAssignModal(false); setEditTask(null); resetForm(); }}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0",
                    background: "white", fontSize: "14px", cursor: "pointer", fontWeight: 600, color: "#374151" }}>
                  Cancel
                </button>
                <button onClick={handleSubmitTask} disabled={submitting}
                  className="primary-button"
                  style={{ flex: 2, padding: "10px", borderRadius: "8px", fontSize: "14px",
                    fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Saving..." : editTask ? "Save Changes" : "Assign Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
