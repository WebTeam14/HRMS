import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserMinus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  Plus,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  listRelievingRequests,
  initiateRelieving,
} from "../../services/relievingService";
import { getEmployees, type Employee } from "../../services/employeeService";
import type { RelievingRequest, RelievingStatus } from "../../types";

const STAGE_LABELS: Record<RelievingStatus, { label: string; color: string; bg: string }> = {
  INITIATED: { label: "Initiated", color: "#f59e0b", bg: "#fef3c7" },
  APPROVED: { label: "Approved", color: "#3b82f6", bg: "#dbeafe" },
  CLEARANCE_PENDING: { label: "Clearance Pending", color: "#8b5cf6", bg: "#ede9fe" },
  SETTLED: { label: "Settled (FnF)", color: "#10b981", bg: "#d1fae5" },
  RELIEVED: { label: "Relieved", color: "#6b7280", bg: "#f3f4f6" },
};

const RelievingList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requests, setRequests] = useState<RelievingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Initiate Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [reason, setReason] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState("");

  const isHrOrAdmin =
    user?.role === "HR" || user?.role === "ADMIN" || user?.role === "CEO";

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await listRelievingRequests({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setRequests(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error("Failed to load relieving requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search, page]);

  const openInitiateModal = async () => {
    setIsModalOpen(true);
    setInitError("");
    try {
      const res = await getEmployees({ limit: 100, status: "ACTIVE" });
      setAvailableEmployees(res.data);
      if (res.data.length > 0) {
        setSelectedEmpId(res.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !lastWorkingDay || !reason) {
      setInitError("Please fill in all required fields (Employee, Last Working Day, Reason).");
      return;
    }
    try {
      setInitiating(true);
      setInitError("");
      await initiateRelieving(selectedEmpId, {
        lastWorkingDay,
        reason,
        handoverNotes: handoverNotes || undefined,
        personalEmail: personalEmail || undefined,
        contactPhone: contactPhone || undefined,
      });
      setIsModalOpen(false);
      setReason("");
      setHandoverNotes("");
      setPersonalEmail("");
      setContactPhone("");
      setLastWorkingDay("");
      loadData();
    } catch (err: any) {
      setInitError(err?.response?.data?.message || "Failed to initiate exit process");
    } finally {
      setInitiating(false);
    }
  };

  // Stats calculation
  const initiatedCount = requests.filter((r) => r.status === "INITIATED").length;
  const inClearanceCount = requests.filter(
    (r) => r.status === "APPROVED" || r.status === "CLEARANCE_PENDING"
  ).length;
  const settledCount = requests.filter((r) => r.status === "SETTLED").length;
  const relievedCount = requests.filter((r) => r.status === "RELIEVED").length;

  return (
    <div className="container" style={{ padding: "24px", maxWidth: "1350px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
              }}
            >
              <UserMinus size={22} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Relieving & Exit Management
            </h1>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
            Manage employee resignations, department clearance, full & final settlement (FnF), and relieving letter generation.
          </p>
        </div>

        {isHrOrAdmin && (
          <button
            onClick={openInitiateModal}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              color: "#fff",
              border: "none",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            }}
          >
            <Plus size={18} />
            Initiate Exit / Resignation
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Initiated / Pending Approval</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>{initiatedCount}</div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#ede9fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7c3aed",
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>In Department Clearance</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>{inClearanceCount}</div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
            }}
          >
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Settled (FnF Complete)</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>{settledCount}</div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Completed / Relieved</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>{relievedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search by employee name, code, or reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "9px 12px 9px 38px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "9px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">All Statuses</option>
            <option value="INITIATED">Initiated</option>
            <option value="APPROVED">Approved</option>
            <option value="CLEARANCE_PENDING">Clearance Pending</option>
            <option value="SETTLED">Settled (FnF)</option>
            <option value="RELIEVED">Relieved</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <Clock size={32} className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
            <div>Loading exit requests...</div>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
            <UserMinus size={40} style={{ color: "#94a3b8", margin: "0 auto 12px auto" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              No exit requests found
            </h3>
            <p style={{ fontSize: "14px", margin: 0 }}>
              {search || statusFilter
                ? "Try adjusting your filters or search criteria."
                : "Initiate an exit request to begin employee offboarding and clearance."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                    EMPLOYEE
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                    DEPARTMENT / ROLE
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                    RESIGNATION DATE
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                    LAST WORKING DAY
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                    STATUS
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "600", color: "#475569", textAlign: "right" }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const emp = req.employeeId;
                  const badge = STAGE_LABELS[req.status] || {
                    label: req.status,
                    color: "#64748b",
                    bg: "#f1f5f9",
                  };
                  return (
                    <tr
                      key={req._id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>
                          {emp ? `${emp.firstName} ${emp.lastName || ""}` : "Unknown"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Code: {emp?.employeeCode || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ fontSize: "13px", color: "#1e293b", fontWeight: "500" }}>
                          {emp?.designation || "Not Assigned"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          {emp?.departmentId?.name || "General"}
                        </div>
                      </td>
                      <td style={{ padding: "16px 18px", fontSize: "13px", color: "#475569" }}>
                        {new Date(req.resignationDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px 18px", fontSize: "13px", color: "#b91c1c", fontWeight: "600" }}>
                        {new Date(req.lastWorkingDay).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: badge.color,
                            backgroundColor: badge.bg,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => navigate(`/relieving/${req._id}`)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            color: "#334155",
                            fontSize: "13px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.color = "#2563eb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.color = "#334155";
                          }}
                        >
                          <Eye size={15} />
                          Manage Exit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Showing page {page} of {totalPages} ({total} total requests)
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "13px",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "13px",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Initiate Exit */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "580px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserMinus size={20} />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Initiate Employee Exit & Relieving
              </h2>
            </div>

            {initError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                <AlertCircle size={18} />
                <span>{initError}</span>
              </div>
            )}

            <form onSubmit={handleInitiate}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Select Employee *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                  required
                >
                  {availableEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName || ""} ({emp.employeeCode}) - {emp.designation || "Staff"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Last Working Day *
                </label>
                <input
                  type="date"
                  value={lastWorkingDay}
                  onChange={(e) => setLastWorkingDay(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Reason for Resignation / Exit *
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Higher studies, Personal reasons, Career growth..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Personal Email (for Relieving Docs)
                  </label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="john.doe@gmail.com"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Handover Notes / Key Responsibilities
                </label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Notes about pending projects, handover person, account transfers..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initiating}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: initiating ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  {initiating ? "Initiating..." : "Initiate Exit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelievingList;
