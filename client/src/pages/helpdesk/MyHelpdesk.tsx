import { useEffect, useState } from "react";
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
  Users,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getMyTickets,
  getAllTickets,
  createTicket,
  resolveTicket,
} from "../../services/helpdeskService";
import type {
  HelpdeskTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../../types";

const MyHelpdesk = () => {
  const { user } = useAuth();
  const isManagement =
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "CEO" ||
    user?.role === "MANAGER";

  const [activeTab, setActiveTab] = useState<"ALL" | "MY">(
    isManagement ? "ALL" : "MY"
  );
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "">("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [resolveTicketModal, setResolveTicketModal] = useState<HelpdeskTicket | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [newTicket, setNewTicket] = useState<{
    category: TicketCategory;
    subject: string;
    description: string;
    priority: TicketPriority;
  }>({
    category: "HR",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "ALL" && isManagement) {
        const res = await getAllTickets({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        });
        setTickets(res.data);
        const open = res.data.filter((t) => t.status === "OPEN").length;
        const inProgress = res.data.filter((t) => t.status === "IN_PROGRESS").length;
        const resolved = res.data.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
        setStats({ open, inProgress, resolved });
      } else {
        const res = await getMyTickets({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        });
        setTickets(res.data);
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [activeTab, statusFilter, categoryFilter]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      setModalError("Please provide both a subject and a description");
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      await createTicket(newTicket);
      setShowCreateModal(false);
      setNewTicket({
        category: "HR",
        subject: "",
        description: "",
        priority: "MEDIUM",
      });
      await loadTickets();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTicketModal) return;
    if (!resolutionNotes.trim()) {
      setResolveError("Please provide resolution notes");
      return;
    }

    try {
      setResolving(true);
      setResolveError(null);
      await resolveTicket(resolveTicketModal._id, resolutionNotes);
      setResolveTicketModal(null);
      setResolutionNotes("");
      await loadTickets();
    } catch (err: any) {
      setResolveError(err?.response?.data?.message || "Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "RESOLVED":
      case "CLOSED":
        return <span className="status-badge active">Resolved</span>;
      case "IN_PROGRESS":
        return <span className="status-badge on_leave">In Progress</span>;
      case "OPEN":
      default:
        return <span className="status-badge inactive">Open</span>;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case "URGENT":
        return <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "11px" }}>● Urgent</span>;
      case "HIGH":
        return <span style={{ color: "#ea580c", fontWeight: 600, fontSize: "11px" }}>● High</span>;
      case "MEDIUM":
        return <span style={{ color: "#2563eb", fontWeight: 600, fontSize: "11px" }}>● Medium</span>;
      case "LOW":
      default:
        return <span style={{ color: "#64748b", fontSize: "11px" }}>● Low</span>;
    }
  };

  return (
    <div className="helpdesk-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Helpdesk & Support Requests</h1>
          <p>
            {isManagement && activeTab === "ALL"
              ? "Review, track, and resolve employee support queries across the organization"
              : "Raise queries or requests for HR, IT, Payroll, or Administration"}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setShowCreateModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={16} /> Raise Support Request
        </button>
      </div>

      {/* Management Tab Switcher */}
      {isManagement && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              border: "none",
              background: activeTab === "ALL" ? "#0f172a" : "#f1f5f9",
              color: activeTab === "ALL" ? "white" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Users size={15} /> All Employee Requests
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("MY")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              border: "none",
              background: activeTab === "MY" ? "#0f172a" : "#f1f5f9",
              color: activeTab === "MY" ? "white" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LifeBuoy size={15} /> My Personal Tickets
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="dashboard-cards" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <AlertCircle size={20} />
          </div>
          <div className="stat-content">
            <span>Open Tickets</span>
            <strong>{stats.open}</strong>
            <small>Awaiting response</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span>In Progress</span>
            <strong>{stats.inProgress}</strong>
            <small>Being worked on</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-content">
            <span>Resolved</span>
            <strong>{stats.resolved}</strong>
            <small>Successfully resolved</small>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="details-card"
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Tag size={14} color="#64748b" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              fontSize: "13px",
            }}
          >
            <option value="">All Categories</option>
            <option value="HR">Human Resources (HR)</option>
            <option value="IT">IT Support</option>
            <option value="PAYROLL">Payroll & Salary</option>
            <option value="ADMIN">Administration</option>
            <option value="GENERAL">General Query</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              fontSize: "13px",
            }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="details-card" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading support tickets...
          </div>
        ) : error ? (
          <div style={{ padding: "30px", color: "#dc2626", background: "#fef2f2" }}>
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center" }}>
            <LifeBuoy size={40} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>No support requests yet</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>
              Have a question or request for HR, IT, or Payroll? Raise a ticket and track its resolution.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreateModal(true)}
            >
              Raise Your First Request
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  {isManagement && activeTab === "ALL" && <th>Employee</th>}
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Resolution / Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => {
                  const emp: any = t.employeeId;
                  const empName = emp?.firstName ? `${emp.firstName} ${emp.lastName}` : "Employee";
                  const empCode = emp?.employeeCode || "";

                  return (
                    <tr key={t._id}>
                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "13px" }}>{t.ticketNumber}</strong>
                      </td>
                      {isManagement && activeTab === "ALL" && (
                        <td>
                          <div>
                            <strong style={{ display: "block", color: "#0f172a", fontSize: "13px" }}>
                              {empName}
                            </strong>
                            <small style={{ color: "#64748b" }}>{empCode}</small>
                          </div>
                        </td>
                      )}
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "#f1f5f9",
                            color: "#334155",
                          }}
                        >
                          {t.category}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong style={{ display: "block", color: "#0f172a" }}>{t.subject}</strong>
                          <small style={{ color: "#64748b" }}>
                            {t.description.length > 60
                              ? `${t.description.substring(0, 60)}...`
                              : t.description}
                          </small>
                        </div>
                      </td>
                      <td>{getPriorityBadge(t.priority)}</td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td style={{ color: "#64748b", fontSize: "13px" }}>
                        {new Date(t.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        {t.resolutionNotes ? (
                          <div style={{ fontSize: "12px", color: "#059669", display: "flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={13} /> {t.resolutionNotes}
                          </div>
                        ) : isManagement && t.status !== "RESOLVED" && t.status !== "CLOSED" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setResolveTicketModal(t);
                              setResolutionNotes("");
                              setResolveError(null);
                            }}
                            style={{
                              padding: "5px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "#059669",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Check size={13} /> Resolve
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Pending review</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Ticket Modal */}
      {resolveTicketModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3>Resolve Ticket {resolveTicketModal.ticketNumber}</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setResolveTicketModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveTicket}>
              <div className="modal-body">
                {resolveError && <div className="error-banner">{resolveError}</div>}

                <div style={{ marginBottom: "14px", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                  <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>
                    Subject: {resolveTicketModal.subject}
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {resolveTicketModal.description}
                  </p>
                </div>

                <div className="form-group">
                  <label>Resolution Remarks & Actions Taken *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Issue resolved. Updated tax slab settings in payroll module."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setResolveTicketModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: "#059669" }}
                  disabled={resolving}
                >
                  {resolving ? "Resolving..." : "Mark as Resolved"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <LifeBuoy size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>Raise Support Request</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTicket}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label>Department / Category *</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, category: e.target.value as any }))
                    }
                  >
                    <option value="HR">Human Resources (HR)</option>
                    <option value="IT">IT Support / Hardware</option>
                    <option value="PAYROLL">Payroll & Salary</option>
                    <option value="ADMIN">Administration</option>
                    <option value="GENERAL">General Query</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, priority: e.target.value as any }))
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Subject / Summary *</label>
                <input
                  type="text"
                  placeholder="e.g. Need salary certificate / Laptop charger replacement"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label>Description & Details *</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue or request in detail..."
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket((prev) => ({ ...prev, description: e.target.value }))
                  }
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHelpdesk;
