import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  UploadCloud,
  FileText,
  UserCheck,
  ShieldAlert,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getOnboardingByEmployee,
  updateOnboardingTask,
  uploadOnboardingDocument,
  verifyOnboardingDocument,
} from "../../services/onboardingService";
import type {
  OnboardingChecklist,
  OnboardingDocument,
  OnboardingStatus,
  DocumentType,
} from "../../types";

const STAGES: Array<{ key: OnboardingStatus; label: string; desc: string }> = [
  { key: "INVITED", label: "1. Invited", desc: "Checklist initiated" },
  { key: "DOCS_PENDING", label: "2. Docs Pending", desc: "Upload candidate files" },
  { key: "VERIFIED", label: "3. Verified", desc: "HR/Admin approved" },
  { key: "ACTIVE", label: "4. Active", desc: "Ready for day 1" },
];

const DOC_TYPES: Array<{ value: DocumentType; label: string }> = [
  { value: "ID_PROOF", label: "Government ID / Aadhaar / Passport" },
  { value: "EDUCATION", label: "Educational Degree / Certificates" },
  { value: "BANK", label: "Bank Account Proof / Cancelled Cheque" },
  { value: "OFFER_LETTER", label: "Signed Offer & Appointment Letter" },
  { value: "EXPERIENCE", label: "Prior Experience / Relieving Letters" },
  { value: "OTHER", label: "Other Documents" },
];

const OnboardingDetails = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [documents, setDocuments] = useState<OnboardingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload Doc Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("ID_PROOF");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Reject Modal
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const isHrOrAdmin =
    user?.role === "HR" || user?.role === "ADMIN" || user?.role === "CEO";

  const loadDetails = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setError("");
      const res = await getOnboardingByEmployee(employeeId);
      setChecklist(res.data.checklist);
      setDocuments(res.data.documents);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load onboarding details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [employeeId]);

  const handleToggleTask = async (taskId: string, currentStatus: "PENDING" | "COMPLETED") => {
    if (!employeeId) return;
    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await updateOnboardingTask(employeeId, taskId, newStatus);
      loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update task");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !docTitle || !docFileUrl) return;
    try {
      setUploading(true);
      await uploadOnboardingDocument(employeeId, {
        title: docTitle,
        type: docType,
        fileUrl: docFileUrl,
        fileName: `${docTitle}.pdf`,
      });
      setIsUploadOpen(false);
      setDocTitle("");
      setDocFileUrl("");
      loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyDoc = async (docId: string, status: "VERIFIED" | "REJECTED", reason?: string) => {
    try {
      await verifyOnboardingDocument(docId, status, reason);
      setRejectingDocId(null);
      setRejectionReason("");
      loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to verify document");
    }
  };

  if (loading) {
    return (
      <div className="employees-page">
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          Loading onboarding file...
        </div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="employees-page">
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="back-button"
          style={{ marginBottom: "20px" }}
        >
          <ArrowLeft size={16} /> Back to Onboardings
        </button>
        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "20px", borderRadius: "12px" }}>
          ⚠️ {error || "Onboarding record not found."}
        </div>
      </div>
    );
  }

  const emp = checklist.employeeId;
  const currentStageIndex = STAGES.findIndex((s) => s.key === checklist.status);
  const completedTasks = checklist.tasks.filter((t) => t.status === "COMPLETED").length;
  const totalTasks = checklist.tasks.length;
  const verifiedDocs = documents.filter((d) => d.verificationStatus === "VERIFIED").length;

  return (
    <div className="employees-page">
      {/* Topbar navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="back-button"
        >
          <ArrowLeft size={16} /> Back to Onboardings
        </button>

        {checklist.status === "ACTIVE" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <Sparkles size={16} /> Onboarding Completed — Employee Active
          </div>
        )}
      </div>

      {/* Candidate Profile Header Card */}
      <div className="employee-profile-card" style={{ marginBottom: "24px" }}>
        <div className="employee-avatar-large">
          {emp.firstName?.charAt(0)?.toUpperCase() || "E"}
        </div>
        <div className="employee-profile-info">
          <div className="profile-name-row">
            <h1>{emp.firstName} {emp.lastName || ""}</h1>
            <span className="status-badge status-active">
              {checklist.status.replace("_", " ")}
            </span>
          </div>

          <p className="employee-designation">{emp.designation || "New Hire / Candidate"}</p>

          <div className="profile-meta">
            <span>
              <UserCheck size={14} /> {emp.employeeCode}
            </span>
            <span>
              <Building2 size={14} /> {emp.departmentId?.name || "Unassigned"}
            </span>
            <span>
              <Calendar size={14} /> Joining: {new Date(emp.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span>
              <FileCheck size={14} /> {verifiedDocs} of {documents.length} Docs Verified
            </span>
          </div>
        </div>
      </div>

      {/* State Machine Stepper */}
      <div
        style={{
          background: "#1e293b",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Onboarding Lifecycle State Machine
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {STAGES.map((stg, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = stg.key === checklist.status;
            return (
              <div
                key={stg.key}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: isCurrent
                    ? "rgba(99, 102, 241, 0.18)"
                    : isCompleted
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: isCurrent
                    ? "1px solid #6366f1"
                    : isCompleted
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} color={isCurrent ? "#818cf8" : "#34d399"} style={{ flexShrink: 0, marginTop: "2px" }} />
                ) : (
                  <Clock size={18} color="#64748b" style={{ flexShrink: 0, marginTop: "2px" }} />
                )}
                <div>
                  <strong style={{ display: "block", fontSize: "13px", color: isCurrent ? "#fff" : isCompleted ? "#e2e8f0" : "#64748b" }}>
                    {stg.label}
                  </strong>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{stg.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column: Departmental Checklist Tasks */}
        <div
          style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                Onboarding Tasks Checklist
              </h2>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                {completedTasks} of {totalTasks} tasks completed
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "10px",
                background: completedTasks === totalTasks ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.2)",
                color: completedTasks === totalTasks ? "#34d399" : "#818cf8",
              }}
            >
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% Done
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {checklist.tasks.map((task) => {
              const isDone = task.status === "COMPLETED";
              return (
                <div
                  key={task._id}
                  onClick={() => isHrOrAdmin && handleToggleTask(task._id, task.status)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    background: isDone ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.02)",
                    border: isDone ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(255,255,255,0.06)",
                    cursor: isHrOrAdmin ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    readOnly
                    style={{ width: "16px", height: "16px", accentColor: "#10b981", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, textDecoration: isDone ? "line-through" : "none", color: isDone ? "#94a3b8" : "#fff" }}>
                      {task.title}
                    </p>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Owner: <strong style={{ color: "#818cf8" }}>{task.assigneeRole}</strong>
                      {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`}
                      {isDone && task.completedAt && ` • Completed ${new Date(task.completedAt).toLocaleDateString("en-IN")}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Required Documents */}
        <div
          style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                Candidate Documents
              </h2>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                {verifiedDocs} of {documents.length} verified
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <UploadCloud size={14} /> Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748b", fontSize: "13px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <FileText size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
              No documents uploaded yet. Upload candidate documents to verify them.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {documents.map((doc) => {
                const isVer = doc.verificationStatus === "VERIFIED";
                const isRej = doc.verificationStatus === "REJECTED";

                return (
                  <div
                    key={doc._id}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      background: isVer
                        ? "rgba(16, 185, 129, 0.04)"
                        : isRej
                        ? "rgba(239, 68, 68, 0.04)"
                        : "rgba(255, 255, 255, 0.02)",
                      border: isVer
                        ? "1px solid rgba(16, 185, 129, 0.2)"
                        : isRej
                        ? "1px solid rgba(239, 68, 68, 0.2)"
                        : "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#fff", display: "block" }}>
                          {doc.title}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Type: {doc.type.replace("_", " ")}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: isVer
                            ? "rgba(16, 185, 129, 0.15)"
                            : isRej
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                          color: isVer ? "#34d399" : isRej ? "#f87171" : "#fbbf24",
                        }}
                      >
                        {doc.verificationStatus}
                      </span>
                    </div>

                    {doc.rejectionReason && (
                      <p style={{ margin: "4px 0 8px", fontSize: "11px", color: "#f87171" }}>
                        Reason: {doc.rejectionReason}
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "12px", color: "#818cf8", textDecoration: "none" }}
                      >
                        View File ↗
                      </a>

                      {isHrOrAdmin && doc.verificationStatus === "PENDING" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => handleVerifyDoc(doc._id, "VERIFIED")}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 600,
                              borderRadius: "4px",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              cursor: "pointer",
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingDocId(doc._id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 600,
                              borderRadius: "4px",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#f87171",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              cursor: "pointer",
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <UploadCloud size={18} color="#818cf8" /> Upload Onboarding Document
              </h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                  Document Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhaar Card Front & Back"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                  Document Category:
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                >
                  {DOC_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                  Document File URL or Storage Path:
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://storage.technoriya.com/docs/file.pdf"
                  value={docFileUrl}
                  onChange={(e) => setDocFileUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="primary-button"
                >
                  {uploading ? "Saving..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingDocId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "420px",
              color: "#fff",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#f87171", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={18} /> Reject Document
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#94a3b8" }}>
              Please provide a reason why this document is rejected so the candidate can re-upload.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Scanned copy is blurry, bank IFSC code is illegible..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setRejectingDocId(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDoc(rejectingDocId, "REJECTED", rejectionReason)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingDetails;
