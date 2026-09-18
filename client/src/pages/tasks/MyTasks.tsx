import { useEffect, useState } from "react";
import {
  AlertTriangle, Clock, CheckCircle2, ListTodo,
  Calendar, User, RefreshCw,
} from "lucide-react";
import {
  getMyTasks, updateTaskStatus,
  type Task, type TaskStatus, type TaskPriority, type TaskStats,
} from "../../services/taskService";

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  LOW:    { label: "Low",    color: "#64748b", bg: "#f1f5f9" },
  MEDIUM: { label: "Medium", color: "#d97706", bg: "#fef3c7" },
  HIGH:   { label: "High",   color: "#dc2626", bg: "#fef2f2" },
  URGENT: { label: "Urgent!", color: "#fff",   bg: "#dc2626" },
};

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string; icon: any }> = {
  TODO:        { label: "To Do",       color: "#64748b", bg: "#f1f5f9",  icon: ListTodo },
  IN_PROGRESS: { label: "In Progress", color: "#2563eb", bg: "#eff6ff",  icon: Clock },
  COMPLETED:   { label: "Completed",   color: "#059669", bg: "#f0fdf4",  icon: CheckCircle2 },
  OVERDUE:     { label: "Overdue",     color: "#dc2626", bg: "#fef2f2",  icon: AlertTriangle },
};

const MyTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, overdue: 0, inProgress: 0, todo: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getMyTasks(params);
      setTasks(res.data.data);
      setStats(res.data.stats);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      setUpdating(taskId);
      await updateTaskStatus(taskId, status);
      load();
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  // Completion ring percentage
  const completionPct = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  const isOverdue = (t: Task) => t.status === "OVERDUE";
  const isDueToday = (t: Task) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== "COMPLETED";
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1>My Tasks</h1>
          <p>Your assigned tasks — update status as you progress</p>
        </div>
        <button onClick={load} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0",
          background: "white", fontSize: "13px", cursor: "pointer", color: "#374151", fontWeight: 600,
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Alert strips */}
      {stats.overdue > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 18px", borderRadius: "10px",
          background: "#fef2f2", border: "1.5px solid #fca5a5",
          color: "#dc2626", fontWeight: 700, fontSize: "14px", marginBottom: "14px",
          animation: "pulse 2s infinite",
        }}>
          <AlertTriangle size={18} />
          🚨 You have {stats.overdue} overdue task{stats.overdue > 1 ? "s" : ""}! Please take action immediately.
        </div>
      )}
      {stats.todo > 0 && stats.overdue === 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "11px 18px", borderRadius: "10px",
          background: "#fffbeb", border: "1px solid #fde68a",
          color: "#92400e", fontWeight: 600, fontSize: "13px", marginBottom: "14px",
        }}>
          <Clock size={16} />
          You have {stats.todo} pending task{stats.todo > 1 ? "s" : ""} to start.
        </div>
      )}
      {stats.completed === stats.total && stats.total > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "11px 18px", borderRadius: "10px",
          background: "#f0fdf4", border: "1px solid #a7f3d0",
          color: "#065f46", fontWeight: 700, fontSize: "13px", marginBottom: "14px",
        }}>
          <CheckCircle2 size={16} />
          🎉 All tasks completed! Great work.
        </div>
      )}

      {/* Stats Row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "14px", marginBottom: "22px",
      }}>
        {/* Completion Ring */}
        <div style={{
          background: "white", borderRadius: "14px", border: "1px solid #e2e8f0",
          padding: "18px", display: "flex", flexDirection: "column",
          alignItems: "center", gap: "8px",
        }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="45" cy="45" r="36" fill="none" stroke="#059669" strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" transform="rotate(-90 45 45)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            <text x="45" y="50" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0f172a">
              {completionPct}%
            </text>
          </svg>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Completion Rate</span>
        </div>

        {[
          { label: "Total", value: stats.total, color: "#0f172a", bg: "white" },
          { label: "To Do", value: stats.todo, color: "#64748b", bg: "#f8fafc" },
          { label: "In Progress", value: stats.inProgress, color: "#2563eb", bg: "#eff6ff" },
          { label: "Overdue", value: stats.overdue, color: "#dc2626", bg: "#fef2f2" },
          { label: "Completed", value: stats.completed, color: "#059669", bg: "#f0fdf4" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: "14px", border: "1px solid #e2e8f0",
            padding: "18px 16px", display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        {[
          { value: "", label: "All Tasks" },
          { value: "TODO", label: "📋 To Do" },
          { value: "IN_PROGRESS", label: "🔄 In Progress" },
          { value: "OVERDUE", label: "🚨 Overdue" },
          { value: "COMPLETED", label: "✅ Completed" },
        ].map((tab) => (
          <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
            style={{
              padding: "7px 14px", borderRadius: "20px", border: "1.5px solid",
              borderColor: filterStatus === tab.value ? "#172033" : "#e2e8f0",
              background: filterStatus === tab.value ? "#172033" : "white",
              color: filterStatus === tab.value ? "white" : "#374151",
              fontSize: "13px", cursor: "pointer", fontWeight: filterStatus === tab.value ? 700 : 500,
              transition: "all 0.15s",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: "14px", background: "#fef2f2", borderRadius: "10px",
          color: "#dc2626", marginBottom: "16px", border: "1px solid #fecaca" }}>{error}</div>
      )}

      {/* Task List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px", background: "white",
          borderRadius: "14px", border: "1px solid #e2e8f0", color: "#94a3b8",
        }}>
          <ListTodo size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: "15px", fontWeight: 600 }}>No tasks assigned to you</p>
          <p style={{ fontSize: "13px" }}>Check back later or contact your manager.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tasks.map((task) => {
            const pm = PRIORITY_META[task.priority];
            const sm = STATUS_META[task.status];
            const StatusIcon = sm.icon;
            const overdue = isOverdue(task);
            const dueToday = isDueToday(task);
            const assignerName = task.assignedById
              ? `${task.assignedById.firstName} ${task.assignedById.lastName || ""}`
              : "System";

            return (
              <div key={task._id} style={{
                background: "white", borderRadius: "14px", padding: "18px 20px",
                border: overdue ? "2px solid #fca5a5" : dueToday ? "2px solid #fcd34d" : "1px solid #e2e8f0",
                boxShadow: overdue ? "0 0 0 3px rgba(220,38,38,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
                transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>

                  {/* Left: info */}
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "2px 8px",
                        borderRadius: "10px", background: pm.bg, color: pm.color,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>{pm.label}</span>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                        borderRadius: "10px", background: sm.bg, color: sm.color,
                        display: "flex", alignItems: "center", gap: "4px",
                      }}>
                        <StatusIcon size={10} /> {sm.label}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#64748b" }}>
                      {task.dueDate && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          color: overdue ? "#dc2626" : dueToday ? "#d97706" : "#64748b",
                          fontWeight: overdue || dueToday ? 700 : 400,
                        }}>
                          <Calendar size={12} />
                          {overdue ? "⚠ OVERDUE — " : dueToday ? "⏰ Due today — " : "Due: "}
                          {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <User size={12} />
                        Assigned by: {assignerName}
                      </span>
                      {task.estimatedHours > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Clock size={12} />
                          Est. {task.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: status selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Update Status
                    </label>
                    <select
                      value={task.status}
                      disabled={updating === task._id}
                      onChange={(e) => handleStatusChange(task._id, e.target.value as TaskStatus)}
                      style={{
                        padding: "8px 12px", borderRadius: "8px",
                        border: `1.5px solid ${sm.color}20`,
                        background: sm.bg, color: sm.color,
                        fontWeight: 600, fontSize: "13px", cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="TODO">📋 To Do</option>
                      <option value="IN_PROGRESS">🔄 In Progress</option>
                      <option value="COMPLETED">✅ Completed</option>
                    </select>
                    {updating === task._id && (
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Updating...</span>
                    )}
                    {task.completedAt && (
                      <span style={{ fontSize: "11px", color: "#059669" }}>
                        ✓ Done {new Date(task.completedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
