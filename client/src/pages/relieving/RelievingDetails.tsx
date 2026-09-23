import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  DollarSign,
  Printer,
  ShieldCheck,
  UserCheck,
  Check,
  X,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getRelievingDetails,
  approveRelieving,
  updateClearanceItem,
  saveFnFSettlement,
  finalizeRelief,
  getRelievingLetter,
} from "../../services/relievingService";
import type {
  RelievingRequest,
  ClearanceChecklist,
  ClearanceItem,
  ClearanceItemStatus,
  FnFSettlement,
  RelievingStatus,
  RelievingLetterData,
  FnFEarnings,
  FnFDeductions,
} from "../../types";

const STAGES: Array<{ key: RelievingStatus; label: string; desc: string }> = [
  { key: "INITIATED", label: "1. Initiated", desc: "Resignation submitted" },
  { key: "APPROVED", label: "2. Approved", desc: "Exit approved by HR/Manager" },
  { key: "CLEARANCE_PENDING", label: "3. Clearance", desc: "Department No-Dues" },
  { key: "SETTLED", label: "4. FnF Settled", desc: "Accounts settlement" },
  { key: "RELIEVED", label: "5. Relieved", desc: "Letter issued & Deactivated" },
];

const RelievingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<RelievingRequest | null>(null);
  const [clearance, setClearance] = useState<ClearanceChecklist | null>(null);
  const [settlement, setSettlement] = useState<FnFSettlement | null>(null);
  const [letterData, setLetterData] = useState<RelievingLetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Approval modal
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approving, setApproving] = useState(false);

  // Active Tab: 'CLEARANCE' | 'FNF' | 'LETTER'
  const [activeTab, setActiveTab] = useState<"CLEARANCE" | "FNF" | "LETTER">("CLEARANCE");

  // FnF Form State
  const [earnings, setEarnings] = useState<FnFEarnings>({
    basic: 0,
    hra: 0,
    leaveEncashment: 0,
    bonus: 0,
    gratuity: 0,
    otherEarnings: 0,
    totalEarnings: 0,
  });

  const [deductions, setDeductions] = useState<FnFDeductions>({
    noticePayDeduction: 0,
    assetDamage: 0,
    pfDeduction: 0,
    taxDeduction: 0,
    otherDeductions: 0,
    totalDeductions: 0,
  });

  const [fnfRemarks, setFnfRemarks] = useState("");
  const [savingFnF, setSavingFnF] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const isHrOrAdmin =
    user?.role === "HR" || user?.role === "ADMIN" || user?.role === "CEO";
  const isAccounts = user?.role === "ACCOUNTS" || isHrOrAdmin;

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await getRelievingDetails(id);
      const req = res.data.request;
      setRequest(req);
      setClearance(res.data.clearance);
      setSettlement(res.data.settlement);

      if (res.data.settlement) {
        setEarnings(res.data.settlement.earnings);
        setDeductions(res.data.settlement.deductions);
        setFnfRemarks(res.data.settlement.remarks || "");
      } else if (req.employeeId.monthlySalary) {
        // Pre-fill basic salary calculations from employee record
        const basic = Math.round(req.employeeId.monthlySalary * 0.5);
        const hra = Math.round(req.employeeId.monthlySalary * 0.3);
        const total = basic + hra;
        setEarnings((prev) => ({
          ...prev,
          basic,
          hra,
          totalEarnings: total,
        }));
      }

      if (req.status === "RELIEVED") {
        fetchRelievingLetter();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load relieving details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelievingLetter = async () => {
    if (!id) return;
    try {
      const res = await getRelievingLetter(id);
      setLetterData(res.data);
    } catch (err) {
      console.error("Failed to load relieving letter", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handle Approval
  const handleApprove = async () => {
    if (!id) return;
    try {
      setApproving(true);
      await approveRelieving(id, approvalRemarks);
      setIsApproveOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve exit request");
    } finally {
      setApproving(false);
    }
  };

  // Handle Clearance item toggle
  const handleClearanceChange = async (
    itemId: string,
    newStatus: ClearanceItemStatus,
    remarks?: string
  ) => {
    if (!id) return;
    try {
      await updateClearanceItem(id, itemId, newStatus, remarks);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update clearance item");
    }
  };

  // Handle FnF computation
  const updateEarningField = (field: keyof FnFEarnings, value: number) => {
    const updated = { ...earnings, [field]: value };
    const total =
      updated.basic +
      updated.hra +
      updated.leaveEncashment +
      updated.bonus +
      updated.gratuity +
      updated.otherEarnings;
    updated.totalEarnings = total;
    setEarnings(updated);
  };

  const updateDeductionField = (field: keyof FnFDeductions, value: number) => {
    const updated = { ...deductions, [field]: value };
    const total =
      updated.noticePayDeduction +
      updated.assetDamage +
      updated.pfDeduction +
      updated.taxDeduction +
      updated.otherDeductions;
    updated.totalDeductions = total;
    setDeductions(updated);
  };

  const netPayable = earnings.totalEarnings - deductions.totalDeductions;

  const handleSaveFnF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSavingFnF(true);
      await saveFnFSettlement(id, {
        earnings,
        deductions,
        remarks: fnfRemarks,
      });
      alert("FnF Settlement details saved successfully!");
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save FnF settlement");
    } finally {
      setSavingFnF(false);
    }
  };

  const handleFinalizeRelief = async () => {
    if (!id) return;
    if (
      !confirm(
        "Are you sure you want to finalize this employee's relieving? This will generate the official relieving letter and deactivate their login credentials."
      )
    ) {
      return;
    }
    try {
      setFinalizing(true);
      await finalizeRelief(id);
      alert("Employee relieved successfully! Relieving letter generated.");
      await loadData();
      setActiveTab("LETTER");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to finalize relief");
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
        <Clock size={36} className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
        <div>Loading exit request details...</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <AlertCircle size={24} />
          <div>
            <div style={{ fontWeight: "600" }}>Error</div>
            <div>{error || "Exit request not found"}</div>
          </div>
        </div>
        <button
          onClick={() => navigate("/relieving")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Back to Relieving List
        </button>
      </div>
    );
  }

  const emp = request.employeeId;
  const currentStageIndex = STAGES.findIndex((s) => s.key === request.status);

  // Group clearance items by departmentCode
  const clearanceByDept: Record<string, ClearanceItem[]> = {};
  if (clearance && clearance.items) {
    clearance.items.forEach((item) => {
      const code = item.departmentCode || "GENERAL";
      if (!clearanceByDept[code]) clearanceByDept[code] = [];
      clearanceByDept[code].push(item);
    });
  }

  return (
    <div className="container" style={{ padding: "24px", maxWidth: "1350px", margin: "0 auto" }}>
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <button
          onClick={() => navigate("/relieving")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#475569",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} />
          Back to Relieving List
        </button>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {request.status === "INITIATED" && isHrOrAdmin && (
            <button
              onClick={() => setIsApproveOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#fff",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
              }}
            >
              <UserCheck size={16} />
              Approve Exit Request
            </button>
          )}

          {(request.status === "CLEARANCE_PENDING" || request.status === "APPROVED" || request.status === "SETTLED") &&
            isHrOrAdmin && (
              <button
                onClick={handleFinalizeRelief}
                disabled={finalizing || Boolean(clearance && !clearance.allCleared)}
                title={
                  clearance && !clearance.allCleared
                    ? "All department clearance items must be CLEARED first."
                    : ""
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    clearance && !clearance.allCleared
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor:
                    finalizing || (clearance && !clearance.allCleared)
                      ? "not-allowed"
                      : "pointer",
                  boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
                }}
              >
                <CheckCircle2 size={16} />
                {finalizing ? "Finalizing..." : "Finalize Relief & Issue Letter"}
              </button>
            )}

          {request.status === "RELIEVED" && (
            <button
              onClick={() => {
                setActiveTab("LETTER");
                window.print();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#0f172a",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <Printer size={16} />
              Print Relieving Letter
            </button>
          )}
        </div>
      </div>

      {/* Employee Overview Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "20px",
            marginBottom: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                {emp.firstName} {emp.lastName || ""}
              </h1>
              <span
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {request.status}
              </span>
            </div>
            <div style={{ color: "#64748b", fontSize: "14px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span>Code: <strong>{emp.employeeCode}</strong></span>
              <span>•</span>
              <span>Designation: <strong>{emp.designation || "N/A"}</strong></span>
              <span>•</span>
              <span>Department: <strong>{emp.departmentId?.name || "General"}</strong></span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Last Working Day</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#dc2626" }}>
              {new Date(request.lastWorkingDay).toLocaleDateString()}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Resigned: {new Date(request.resignationDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            fontSize: "13px",
          }}
        >
          <div>
            <span style={{ color: "#64748b", display: "block" }}>Reason for Exit:</span>
            <strong style={{ color: "#0f172a" }}>{request.reason}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block" }}>Personal Email:</span>
            <strong style={{ color: "#0f172a" }}>{request.personalEmail || "N/A"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block" }}>Contact Phone:</span>
            <strong style={{ color: "#0f172a" }}>{request.contactPhone || emp.phone || "N/A"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block" }}>Joining Date:</span>
            <strong style={{ color: "#0f172a" }}>{new Date(emp.joiningDate).toLocaleDateString()}</strong>
          </div>
          {request.handoverNotes && (
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "#64748b", display: "block" }}>Handover Notes:</span>
              <p style={{ margin: "4px 0 0 0", color: "#334155" }}>{request.handoverNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Exit Progression Stepper */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "20px 24px",
          marginBottom: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "16px" }}>
          EXIT PROGRESSION STAGE
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {STAGES.map((s, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            return (
              <div
                key={s.key}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: isCurrent
                    ? "2px solid #ef4444"
                    : isCompleted
                    ? "1px solid #10b981"
                    : "1px solid #e2e8f0",
                  background: isCurrent ? "#fef2f2" : isCompleted ? "#f0fdf4" : "#f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  {isCompleted ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (
                    <Clock size={18} color="#94a3b8" />
                  )}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: isCurrent ? "#b91c1c" : isCompleted ? "#065f46" : "#64748b",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs: Clearance Checklist | FnF Settlement | Relieving Letter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("CLEARANCE")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            border: "1px solid",
            borderColor: activeTab === "CLEARANCE" ? "#ef4444" : "#cbd5e1",
            background: activeTab === "CLEARANCE" ? "#ef4444" : "#fff",
            color: activeTab === "CLEARANCE" ? "#fff" : "#475569",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShieldCheck size={16} />
          Department Clearance ({clearance?.items?.filter((i) => i.status === "CLEARED").length || 0}/
          {clearance?.items?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("FNF")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            border: "1px solid",
            borderColor: activeTab === "FNF" ? "#ef4444" : "#cbd5e1",
            background: activeTab === "FNF" ? "#ef4444" : "#fff",
            color: activeTab === "FNF" ? "#fff" : "#475569",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <DollarSign size={16} />
          Full & Final (FnF) Settlement {settlement ? `(${settlement.status})` : ""}
        </button>

        <button
          onClick={() => {
            setActiveTab("LETTER");
            if (!letterData) fetchRelievingLetter();
          }}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            border: "1px solid",
            borderColor: activeTab === "LETTER" ? "#ef4444" : "#cbd5e1",
            background: activeTab === "LETTER" ? "#ef4444" : "#fff",
            color: activeTab === "LETTER" ? "#fff" : "#475569",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FileText size={16} />
          Relieving Letter
        </button>
      </div>

      {/* TAB 1: Department Clearance */}
      {activeTab === "CLEARANCE" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Inter-Department No-Dues Clearance
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0 0" }}>
                IT, HR, Finance, and Administration must verify that all company assets, credentials, and dues are settled.
              </p>
            </div>
            <div>
              {clearance?.allCleared ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#d1fae5",
                    color: "#065f46",
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <CheckCircle2 size={16} />
                  All Departments Cleared
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <Clock size={16} />
                  Clearance Pending
                </span>
              )}
            </div>
          </div>

          {Object.keys(clearanceByDept).length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              No clearance items configured yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {Object.entries(clearanceByDept).map(([deptCode, items]) => (
                <div
                  key={deptCode}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "12px 18px",
                      borderBottom: "1px solid #e2e8f0",
                      fontWeight: "700",
                      fontSize: "14px",
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Building2 size={16} color="#64748b" />
                    {deptCode} DEPARTMENT CLEARANCE
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    {items.map((item) => {
                      const isCleared = item.status === "CLEARED";
                      const isFlagged = item.status === "FLAGGED";
                      return (
                        <div
                          key={item._id}
                          style={{
                            padding: "12px 18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #f1f5f9",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: "260px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                              {item.item}
                            </div>
                            {item.remarks && (
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                Note: {item.remarks}
                              </div>
                            )}
                            {item.clearedBy && (
                              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                Handled by: {item.clearedBy.email}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background: isCleared
                                  ? "#d1fae5"
                                  : isFlagged
                                  ? "#fee2e2"
                                  : "#fef3c7",
                                color: isCleared
                                  ? "#065f46"
                                  : isFlagged
                                  ? "#991b1b"
                                  : "#92400e",
                              }}
                            >
                              {item.status}
                            </span>

                            {isHrOrAdmin && (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  onClick={() => handleClearanceChange(item._id, "CLEARED")}
                                  title="Mark as Cleared"
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #10b981",
                                    background: isCleared ? "#10b981" : "#fff",
                                    color: isCleared ? "#fff" : "#10b981",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Check size={14} />
                                  Clear
                                </button>
                                <button
                                  onClick={() => {
                                    const rem = prompt("Enter remark/reason for flagging this item:");
                                    if (rem !== null) {
                                      handleClearanceChange(item._id, "FLAGGED", rem);
                                    }
                                  }}
                                  title="Flag issue / asset missing"
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ef4444",
                                    background: isFlagged ? "#ef4444" : "#fff",
                                    color: isFlagged ? "#fff" : "#ef4444",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <X size={14} />
                                  Flag
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FnF Settlement Form */}
      {activeTab === "FNF" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Full & Final (FnF) Settlement Calculator
            </h2>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0 0" }}>
              Calculate final earnings, notice pay deductions, asset damages, and statutory adjustments.
            </p>
          </div>

          <form onSubmit={handleSaveFnF}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              {/* Earnings Column */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#166534", margin: "0 0 14px 0" }}>
                  1. Final Earnings (₹)
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Basic Pay for remaining days:</label>
                    <input
                      type="number"
                      value={earnings.basic}
                      onChange={(e) => updateEarningField("basic", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>HRA:</label>
                    <input
                      type="number"
                      value={earnings.hra}
                      onChange={(e) => updateEarningField("hra", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Leave Encashment (Earned leaves):</label>
                    <input
                      type="number"
                      value={earnings.leaveEncashment}
                      onChange={(e) => updateEarningField("leaveEncashment", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Bonus / Incentives:</label>
                    <input
                      type="number"
                      value={earnings.bonus}
                      onChange={(e) => updateEarningField("bonus", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Gratuity (if applicable):</label>
                    <input
                      type="number"
                      value={earnings.gratuity}
                      onChange={(e) => updateEarningField("gratuity", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Other Earnings / Reimbursements:</label>
                    <input
                      type="number"
                      value={earnings.otherEarnings}
                      onChange={(e) => updateEarningField("otherEarnings", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div
                    style={{
                      borderTop: "2px dashed #bbf7d0",
                      paddingTop: "10px",
                      marginTop: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "700",
                      color: "#166534",
                      fontSize: "15px",
                    }}
                  >
                    <span>Total Earnings:</span>
                    <span>₹{earnings.totalEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  padding: "18px",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#991b1b", margin: "0 0 14px 0" }}>
                  2. Deductions & Recoveries (₹)
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Notice Period Shortfall Recovery:</label>
                    <input
                      type="number"
                      value={deductions.noticePayDeduction}
                      onChange={(e) => updateDeductionField("noticePayDeduction", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Asset Damage / Non-Return Recovery:</label>
                    <input
                      type="number"
                      value={deductions.assetDamage}
                      onChange={(e) => updateDeductionField("assetDamage", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Provident Fund (PF):</label>
                    <input
                      type="number"
                      value={deductions.pfDeduction}
                      onChange={(e) => updateDeductionField("pfDeduction", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Income Tax (TDS):</label>
                    <input
                      type="number"
                      value={deductions.taxDeduction}
                      onChange={(e) => updateDeductionField("taxDeduction", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Other Recoveries:</label>
                    <input
                      type="number"
                      value={deductions.otherDeductions}
                      onChange={(e) => updateDeductionField("otherDeductions", Number(e.target.value))}
                      style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div
                    style={{
                      borderTop: "2px dashed #fecaca",
                      paddingTop: "10px",
                      marginTop: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "700",
                      color: "#991b1b",
                      fontSize: "15px",
                    }}
                  >
                    <span>Total Deductions:</span>
                    <span>₹{deductions.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Payable Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: "12px",
                padding: "20px 24px",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>NET PAYABLE TO EMPLOYEE</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#4ade80" }}>
                  ₹{netPayable.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                Formula: Total Earnings (₹{earnings.totalEarnings.toLocaleString()}) - Total Deductions (₹{deductions.totalDeductions.toLocaleString()})
              </div>
            </div>

            {/* Settlement Remarks */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Settlement Notes / Accounts Remarks
              </label>
              <textarea
                rows={2}
                value={fnfRemarks}
                onChange={(e) => setFnfRemarks(e.target.value)}
                placeholder="Bank transfer reference, cheque number, or settlement notes..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>

            {isAccounts && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={savingFnF}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: savingFnF ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  {savingFnF ? "Saving..." : "Save & Finalize FnF Calculation"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 3: Relieving Letter Preview */}
      {activeTab === "LETTER" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "36px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            maxWidth: "850px",
            margin: "0 auto",
            fontFamily: "'Inter', sans-serif",
            color: "#1e293b",
            lineHeight: "1.7",
          }}
        >
          {/* Official Letterhead */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "3px solid #ef4444",
              paddingBottom: "18px",
              marginBottom: "28px",
            }}
          >
            <div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                TECHNORIYA ETECHNOLOGIES PVT LTD
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Empowering Digital Innovation & Enterprise Solutions
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                CIN: U72200MH2021PTC367412 • hr@technoriya.com
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                color: "#fff",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              T
            </div>
          </div>

          {/* Letter Meta */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "24px",
            }}
          >
            <div>
              Ref No: <strong>{letterData?.referenceNumber || `TETPL/REL/${emp.employeeCode}`}</strong>
            </div>
            <div>
              Date: <strong>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "24px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
            RELIEVING & SERVICE CERTIFICATE
          </div>

          {/* Letter Body */}
          <div style={{ fontSize: "14px", marginBottom: "20px" }}>
            To,<br />
            <strong>{emp.firstName} {emp.lastName || ""}</strong><br />
            Employee ID: <strong>{emp.employeeCode}</strong><br />
            Designation: <strong>{emp.designation || "Executive"}</strong><br />
            Department: <strong>{emp.departmentId?.name || "Operations"}</strong>
          </div>

          <p style={{ fontSize: "14px", marginBottom: "16px" }}>
            Dear <strong>{emp.firstName}</strong>,
          </p>

          <p style={{ fontSize: "14px", marginBottom: "16px", textAlign: "justify" }}>
            This has reference to your resignation letter dated{" "}
            <strong>{new Date(request.resignationDate).toLocaleDateString()}</strong>. We would like to inform you that your resignation has been accepted and you are hereby relieved from your services with{" "}
            <strong>Technoriya eTechnologies Pvt Ltd</strong> as at the close of business hours on{" "}
            <strong>{new Date(request.lastWorkingDay).toLocaleDateString()}</strong>.
          </p>

          <p style={{ fontSize: "14px", marginBottom: "16px", textAlign: "justify" }}>
            During your tenure with us from{" "}
            <strong>{new Date(emp.joiningDate).toLocaleDateString()}</strong> to{" "}
            <strong>{new Date(request.lastWorkingDay).toLocaleDateString()}</strong>, we found your performance, professional conduct, and dedication towards work to be commendable.
          </p>

          <p style={{ fontSize: "14px", marginBottom: "28px", textAlign: "justify" }}>
            All your company assets, security clearances, and accounts dues have been fully verified and settled. We take this opportunity to thank you for your valuable contributions and wish you great success in all your future endeavors.
          </p>

          {/* Signatory Footer */}
          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                For Technoriya eTechnologies Pvt Ltd
              </div>
              <div style={{ height: "45px" }}></div>
              <div style={{ borderTop: "1px solid #94a3b8", width: "200px", paddingTop: "6px" }}>
                <strong>Authorized Signatory</strong>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Human Resources Department</div>
              </div>
            </div>

            <div
              style={{
                border: "2px dashed #cbd5e1",
                padding: "8px 16px",
                borderRadius: "8px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "11px",
              }}
            >
              OFFICIAL SEAL / DIGITAL VERIFIED<br />
              Technoriya eTechnologies HRMS
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {isApproveOpen && (
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
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#dbeafe",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCheck size={20} />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Approve Exit Request
              </h2>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
              Approving this resignation will move the request into the <strong>Clearance Pending</strong> stage and notify IT, Accounts, and Admin departments.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Approval Remarks / Comments
              </label>
              <textarea
                rows={3}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Approved. Please proceed with department handover and clearances..."
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
                onClick={() => setIsApproveOpen(false)}
                style={{
                  padding: "8px 16px",
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
                type="button"
                disabled={approving}
                onClick={handleApprove}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: approving ? "not-allowed" : "pointer",
                }}
              >
                {approving ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelievingDetails;
