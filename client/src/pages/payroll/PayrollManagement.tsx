import { useEffect, useState } from "react";
import {
  DollarSign,
  Calculator,
  Send,
  Printer,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  Edit,
  X,
  FileText,
  CreditCard,
  ShieldCheck,
  Upload,
  Paperclip,
  MessageSquare,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getCompanyPayrollSheet,
  calculateMonthlyPayroll,
  publishMonthlyPayroll,
  updateSalarySlip,
  recordPayment,
  updateSalarySlipQuery,
  formatCurrency,
} from "../../services/payrollService";
import type { SalarySlip, SalarySummary } from "../../types";

const MONTHS = [
  { index: 1, name: "January" },
  { index: 2, name: "February" },
  { index: 3, name: "March" },
  { index: 4, name: "April" },
  { index: 5, name: "May" },
  { index: 6, name: "June" },
  { index: 7, name: "July" },
  { index: 8, name: "August" },
  { index: 9, name: "September" },
  { index: 10, name: "October" },
  { index: 11, name: "November" },
  { index: 12, name: "December" },
];

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
};

const numberToWordsINR = (num: number): string => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    if (n === 0) return "Zero";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        inWords(Math.floor(n / 100)) +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  };

  const rounded = Math.round(num);
  return inWords(rounded).trim() + " Rupees Only";
};

const PayrollManagement = () => {
  const navigate = useNavigate();

  const [monthIndex, setMonthIndex] = useState(9); // September by default
  const [year, setYear] = useState(2026);

  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [summary, setSummary] = useState<SalarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Softcopy Modal State
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  // Edit Slip Modal State
  // Edit Slip Modal State (Manual Entry: Base Salary, Incentive, Tax/TDS, Other Deductions)
  const [editingSlip, setEditingSlip] = useState<SalarySlip | null>(null);
  const [editForm, setEditForm] = useState({
    baseSalary: 0,
    incentives: 0,
    reimbursements: 0,
    taxDeduction: 0,
    otherDeductions: 0,
    pfDeduction: 0,
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Payment Proof Modal State
  const [paymentSlip, setPaymentSlip] = useState<SalarySlip | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    status: "PAID",
    paidVia: "Bank Transfer (NEFT/RTGS)",
    customPaidVia: "",
    paymentReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paidProofUrl: "",
    paidProofName: "",
    notes: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [proofPreviewModal, setProofPreviewModal] = useState<{ url: string; name: string } | null>(null);

  // Employee Queries Modal State for HR
  const [queryModalSlip, setQueryModalSlip] = useState<SalarySlip | null>(null);
  const [respondingQueryId, setRespondingQueryId] = useState<string | null>(null);
  const [hrResponseForm, setHrResponseForm] = useState<{
    status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
    hrRemarks: string;
  }>({
    status: "RESOLVED",
    hrRemarks: "",
  });
  const [savingQueryResponse, setSavingQueryResponse] = useState(false);

  // Filter for only slips with queries
  const [filterWithQueriesOnly, setFilterWithQueriesOnly] = useState(false);

  const loadPayrollSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCompanyPayrollSheet(monthIndex, year);
      setSlips(res.data);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load company payroll sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollSheet();
  }, [monthIndex, year]);

  const handleCalculatePayroll = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to run the automated salary calculation engine for ${MONTHS.find((m) => m.index === monthIndex)?.name} ${year}? This will compute attendance, late marks, leaves, and holidays.`
    );
    if (!confirmed) return;

    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);
      const res = await calculateMonthlyPayroll(monthIndex, year);
      setSlips(res.data);
      if (res.summary) setSummary(res.summary);
      setSuccess(`Payroll calculated successfully for ${MONTHS.find((m) => m.index === monthIndex)?.name} ${year}!`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to run automated payroll calculation");
    } finally {
      setCalculating(false);
    }
  };

  const handlePublishPayroll = async () => {
    const confirmed = window.confirm(
      `Publish salary slips to all employees for ${MONTHS.find((m) => m.index === monthIndex)?.name} ${year}? Employees will immediately see their softcopy slips.`
    );
    if (!confirmed) return;

    try {
      setPublishing(true);
      setError(null);
      setSuccess(null);
      const res = await publishMonthlyPayroll(monthIndex, year);
      setSuccess(res.message || "Salary slips published to employee self-service portals successfully!");
      await loadPayrollSheet();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to publish salary slips");
    } finally {
      setPublishing(false);
    }
  };

  const handleOpenEdit = (slip: SalarySlip) => {
    setEditingSlip(slip);
    const base = slip.grossSalary || slip.basicSalary || 50000;
    setEditForm({
      baseSalary: base,
      incentives: slip.incentives || 0,
      reimbursements: slip.reimbursements || 0,
      taxDeduction: slip.taxDeduction || 0,
      otherDeductions: slip.otherDeductions || 0,
      pfDeduction: slip.pfDeduction || 0,
      notes: slip.notes || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip) return;

    try {
      setSavingEdit(true);
      const baseSalary = Number(editForm.baseSalary) || 0;
      await updateSalarySlip(editingSlip._id, {
        baseSalary,
        grossSalary: baseSalary,
        basicSalary: Math.round(baseSalary * 0.5),
        incentives: Number(editForm.incentives) || 0,
        reimbursements: Number(editForm.reimbursements) || 0,
        taxDeduction: Number(editForm.taxDeduction) || 0,
        otherDeductions: Number(editForm.otherDeductions) || 0,
        pfDeduction: Number(editForm.pfDeduction) || 0,
        professionalTax: 0, // No default deduction
        lopDeduction: 0,    // No default deduction
        notes: editForm.notes,
      });
      setEditingSlip(null);
      await loadPayrollSheet();
      setSuccess("Compensation updated successfully! (Base Salary, Incentive, Tax/TDS, Other Deductions)");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update salary slip");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenPayment = (slip: SalarySlip) => {
    setPaymentSlip(slip);
    const isCustomMethod =
      slip.paidVia &&
      ![
        "Bank Transfer (NEFT/RTGS)",
        "Direct Deposit (Corporate NetBanking)",
        "UPI (GPay / PhonePe / Paytm)",
        "IMPS Immediate Payment",
        "Company Cheque",
        "Cash",
      ].includes(slip.paidVia);

    setPaymentForm({
      status: slip.status || "PAID",
      paidVia: isCustomMethod ? "Other" : (slip.paidVia || "Bank Transfer (NEFT/RTGS)"),
      customPaidVia: isCustomMethod ? (slip.paidVia || "") : "",
      paymentReference: slip.paymentReference || "",
      paymentDate: slip.paymentDate ? new Date(slip.paymentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      paidProofUrl: slip.paidProofUrl || "",
      paidProofName: slip.paidProofName || "",
      notes: slip.notes || "",
    });
  };

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      alert("File size exceeds 6MB limit. Please upload a smaller receipt/screenshot.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPaymentForm((prev) => ({
        ...prev,
        paidProofUrl: result,
        paidProofName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSlip) return;

    try {
      setSavingPayment(true);
      setError(null);
      const effectivePaidVia = paymentForm.paidVia === "Other" && paymentForm.customPaidVia.trim()
        ? paymentForm.customPaidVia.trim()
        : paymentForm.paidVia;

      await recordPayment(paymentSlip._id, {
        status: paymentForm.status,
        paidVia: effectivePaidVia,
        paymentReference: paymentForm.paymentReference,
        paymentDate: paymentForm.paymentDate,
        paidProofUrl: paymentForm.paidProofUrl,
        paidProofName: paymentForm.paidProofName,
        notes: paymentForm.notes,
      });

      setSuccess(`Payment disbursement & proof successfully recorded for ${paymentSlip.month} salary!`);
      setPaymentSlip(null);
      await loadPayrollSheet();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveQueryResponse = async (queryId: string) => {
    if (!queryModalSlip) return;

    try {
      setSavingQueryResponse(true);
      setError(null);
      const res = await updateSalarySlipQuery(queryModalSlip._id, queryId, {
        status: hrResponseForm.status,
        hrRemarks: hrResponseForm.hrRemarks,
      });

      setQueryModalSlip(res.data);
      setRespondingQueryId(null);
      setHrResponseForm({ status: "RESOLVED", hrRemarks: "" });
      setSuccess("Employee payroll query status & HR remarks updated successfully!");
      await loadPayrollSheet();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update employee query");
    } finally {
      setSavingQueryResponse(false);
    }
  };

  const monthName = MONTHS.find((m) => m.index === monthIndex)?.name || "September";

  return (
    <div className="payroll-management-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Enterprise Payroll & Compensation Management</h1>
          <p>Automated salary calculations based on attendance, late marks, leaves, and confirmed holidays</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
            style={{
              padding: "9px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            {MONTHS.map((m) => (
              <option key={m.index} value={m.index}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: "9px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <button
            type="button"
            className="primary-button"
            onClick={handleCalculatePayroll}
            disabled={calculating || loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Calculator size={16} />
            {calculating ? "Calculating..." : "Calculate / Refresh Payroll"}
          </button>

          <button
            type="button"
            onClick={handlePublishPayroll}
            disabled={publishing || loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#059669",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Send size={16} />
            {publishing ? "Publishing..." : "Publish Slips to Employees"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="dashboard-cards" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span>Total Gross Run</span>
            <strong>{summary ? formatCurrency(summary.totalGross) : "—"}</strong>
            <small>{monthName} {year} Budget</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <CreditCard size={20} />
          </div>
          <div className="stat-content">
            <span>Net Disbursed</span>
            <strong>{summary ? formatCurrency(summary.totalNet) : "—"}</strong>
            <small>Direct deposit payout</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span>Loss of Pay (LOP) Days</span>
            <strong>{summary?.totalLopDays !== undefined ? `${summary.totalLopDays} Days` : "0 Days"}</strong>
            <small>Late marks & unapproved absents</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span>Salaried Headcount</span>
            <strong>{summary?.totalEmployees ?? slips.length}</strong>
            <small>Active employee slips</small>
          </div>
        </div>
      </div>

      {/* Attendance & LOP Policy Explainer Banner */}
      <div
        className="details-card"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          borderRadius: "12px",
          padding: "16px 22px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <strong style={{ fontSize: "14px", color: "white", display: "block" }}>
              MNC Payroll Calculation Rules Active
            </strong>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Payable Days = Total Days − LOP (Unapproved Absents + Every 3 Late Marks = 0.5 Day LOP). Confirmed holidays & approved leaves are fully paid.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/holidays")}
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Calendar size={14} /> Confirm / Mark Holidays
        </button>
      </div>

      {/* Payroll Register Sheet Table */}
      <div className="details-card" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
              Payroll Register & Salary Sheet — {monthName} {year}
            </h2>
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>
              Pay Period: 01 {monthName.slice(0, 3)} {year} – {new Date(year, monthIndex, 0).getDate()} {monthName.slice(0, 3)} {year} • Itemized statement of packages, days worked, deductions, and release dates
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setFilterWithQueriesOnly(false)}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "6px",
                background: !filterWithQueriesOnly ? "#2563eb" : "#f1f5f9",
                color: !filterWithQueriesOnly ? "white" : "#475569",
                border: "none",
                cursor: "pointer",
              }}
            >
              All Records ({slips.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterWithQueriesOnly(true)}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "6px",
                background: filterWithQueriesOnly ? "#f59e0b" : "#fffbeb",
                color: filterWithQueriesOnly ? "white" : "#b45309",
                border: "1px solid #fde68a",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <MessageSquare size={13} />
              Employee Queries ({slips.reduce((sum, s) => sum + (s.queries?.length || 0), 0)})
              {slips.some((s) => s.queries?.some((q) => q.status === "OPEN")) && (
                <span
                  style={{
                    background: "#dc2626",
                    color: "white",
                    padding: "1px 5px",
                    borderRadius: "10px",
                    fontSize: "10px",
                  }}
                >
                  {slips.reduce((sum, s) => sum + (s.queries?.filter((q) => q.status === "OPEN").length || 0), 0)} Open
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading salary register...
          </div>
        ) : slips.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <FileText size={36} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: "#64748b" }}>No payroll records generated yet for this month.</p>
            <button
              type="button"
              className="primary-button"
              onClick={handleCalculatePayroll}
              style={{ marginTop: "10px" }}
            >
              Run Payroll Engine
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>Package & Base Gross</th>
                  <th>Present / Paid</th>
                  <th>Late Marks</th>
                  <th>LOP Days</th>
                  <th>Payable Days</th>
                  <th>Gross Earned</th>
                  <th>Deductions</th>
                  <th>Net Take-Home</th>
                  <th>Status & Release Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filterWithQueriesOnly
                  ? slips.filter((s) => (s.queries?.length || 0) > 0)
                  : slips
                ).map((s) => {
                  const emp: any = s.employeeId;
                  const empName = emp?.firstName ? `${emp.firstName} ${emp.lastName}` : "Employee";
                  const empCode = emp?.employeeCode || "";
                  const dept = emp?.departmentId?.name || "General";
                  const designation = emp?.designation || "Staff";

                  return (
                    <tr key={s._id}>
                      <td>
                        <strong style={{ color: "#0f172a", display: "block", fontSize: "13px" }}>
                          {empName}
                        </strong>
                        <small style={{ color: "#64748b" }}>{empCode}</small>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px" }}>
                          <span style={{ color: "#0f172a", fontWeight: 500, display: "block" }}>
                            {designation}
                          </span>
                          <span style={{ color: "#64748b" }}>{dept}</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "13px", display: "block" }}>
                          {formatCurrency(s.grossSalary)}
                        </strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {s.packageAnnualCtc ? `${(s.packageAnnualCtc / 100000).toFixed(2)} LPA CTC` : `${((s.grossSalary * 12) / 100000).toFixed(2)} LPA CTC`}
                        </div>
                        {s.incrementPercentage ? (
                          <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "1px 5px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: "3px", marginTop: "2px" }}>
                            +{s.incrementPercentage}% Hike
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "#334155" }}>
                          <span>{s.presentDays || 22} Present</span>
                          <span style={{ color: "#059669", display: "block" }}>
                            +{s.holidaysCount || 2} Hol • +{s.paidLeaveDays || 0} Leave
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: s.lateMarksCount > 0 ? 600 : 400,
                            color: s.lateMarksCount >= 3 ? "#dc2626" : "#475569",
                          }}
                        >
                          {s.lateMarksCount || 0}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: s.lopDays > 0 ? 700 : 400,
                            color: s.lopDays > 0 ? "#dc2626" : "#64748b",
                          }}
                        >
                          {s.lopDays > 0 ? `${s.lopDays}d` : "0d"}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                          {s.payableDays || s.totalDaysInMonth} / {s.totalDaysInMonth}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                          {formatCurrency(s.grossSalary - (s.lopDeduction || 0))}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: s.totalDeductions > 0 ? "#dc2626" : "#64748b" }}>
                          <span>{s.totalDeductions > 0 ? `−${formatCurrency(s.totalDeductions)}` : "₹0 (No Deductions)"}</span>
                          {s.totalDeductions > 0 && (
                            <small style={{ display: "block", color: "#94a3b8" }}>
                              {s.taxDeduction > 0 ? `Tax: ${formatCurrency(s.taxDeduction)} ` : ""}
                              {s.otherDeductions > 0 ? `Other: ${formatCurrency(s.otherDeductions)} ` : ""}
                              {s.pfDeduction > 0 ? `PF: ${formatCurrency(s.pfDeduction)}` : ""}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#059669", fontSize: "14px" }}>
                          {formatCurrency(s.netSalary)}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <span
                            className={`status-badge ${
                              s.status === "PAID"
                                ? "status-active"
                                : s.status === "PROCESSED"
                                ? "status-notice"
                                : "status-leave"
                            }`}
                          >
                            {s.status}
                          </span>
                          <div style={{ marginTop: "4px", fontSize: "11px", color: s.status === "PAID" ? "#059669" : "#64748b", fontWeight: 600 }}>
                            <Calendar size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                            {s.salaryReleaseDate || s.paymentDate ? formatDate(s.salaryReleaseDate || s.paymentDate) : `${s.totalDaysInMonth || 30} ${s.month.slice(0, 3)} ${s.year}`}
                          </div>
                          {s.status === "PAID" && (
                            <div style={{ marginTop: "2px", fontSize: "11px", color: "#64748b" }}>
                              <span style={{ display: "block", color: "#0f172a", fontWeight: 600 }}>
                                {s.paidVia || "Bank Transfer"}
                              </span>
                              {s.paidProofUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProofPreviewModal({
                                      url: s.paidProofUrl!,
                                      name: s.paidProofName || "Payment Proof",
                                    })
                                  }
                                  style={{
                                    padding: "2px 6px",
                                    marginTop: "2px",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    border: "1px solid #86efac",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                >
                                  <Paperclip size={10} /> Proof Attached
                                </button>
                              ) : (
                                <span style={{ fontSize: "10px", color: "#94a3b8" }}>No proof</span>
                              )}
                            </div>
                          )}
                          {s.queries && s.queries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setQueryModalSlip(s)}
                              style={{
                                marginTop: "4px",
                                padding: "2px 6px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: s.queries.some((q) => q.status === "OPEN")
                                  ? "#fef3c7"
                                  : "#e0f2fe",
                                color: s.queries.some((q) => q.status === "OPEN")
                                  ? "#b45309"
                                  : "#0369a1",
                                border: s.queries.some((q) => q.status === "OPEN")
                                  ? "1px solid #fde68a"
                                  : "1px solid #bae6fd",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <MessageSquare size={10} />
                              {s.queries.some((q) => q.status === "OPEN")
                                ? `⚠️ ${s.queries.filter((q) => q.status === "OPEN").length} Open Query`
                                : `${s.queries.length} Queries`}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSlip(s)}
                            style={{
                              padding: "6px 9px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "#0f172a",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="View Softcopy Slip"
                          >
                            <FileText size={13} /> Softcopy
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPayment(s)}
                            style={{
                              padding: "6px 9px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background:
                                s.status === "PAID" && s.paidProofUrl ? "#ecfdf5" : "#eff6ff",
                              color:
                                s.status === "PAID" && s.paidProofUrl ? "#059669" : "#2563eb",
                              border:
                                s.status === "PAID" && s.paidProofUrl
                                  ? "1px solid #a7f3d0"
                                  : "1px solid #bfdbfe",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Disburse / Upload Payment Proof & Mode"
                          >
                            <CreditCard size={13} />{" "}
                            {s.status === "PAID" ? "Payment Proof" : "Mark Paid"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "#f8fafc",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Adjust Employee Compensation (Base Salary, Incentive, Tax/TDS, Other Deductions)"
                          >
                            <Edit size={13} /> Adjust Comp
                          </button>

                          {s.queries && s.queries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setQueryModalSlip(s)}
                              style={{
                                padding: "6px 8px",
                                fontSize: "12px",
                                background: "#fffbeb",
                                color: "#b45309",
                                border: "1px solid #fde68a",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                              title="View & Respond to Employee Queries"
                            >
                              <MessageSquare size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formal MNC Softcopy Salary Slip Modal */}
      {selectedSlip && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal"
            style={{
              maxWidth: "840px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "32px",
              borderRadius: "16px",
              background: "white",
            }}
          >
            {/* Modal Controls Bar */}
            <div
              className="no-print"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={18} color="#0f172a" />
                <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                  Official MNC Softcopy Salary Slip Preview
                </strong>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="primary-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px" }}
                >
                  <Printer size={15} /> Print / Download PDF
                </button>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setSelectedSlip(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Formal MNC Salary Slip Layout */}
            <div
              id="printable-slip"
              style={{
                border: "2px solid #0f172a",
                padding: "28px",
                borderRadius: "8px",
                background: "white",
                color: "#0f172a",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {/* Header Letterhead */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                    T
                  </div>
                  <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.02em" }}>
                    TECHNORIYA eTECHNOLOGIES PRIVATE LIMITED
                  </h1>
                </div>
                <p style={{ margin: "4px 0 2px", fontSize: "11px", color: "#475569" }}>
                  219, NBC Complex, Opp. ICICI Bank, Sector 11, CBD Belapur, Navi Mumbai, Maharashtra - 400614
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#475569" }}>
                  Email: hr@technoriya.in • Website: www.technoriya.in
                </p>
                <div style={{ marginTop: "12px", display: "inline-block", padding: "4px 18px", borderRadius: "4px", background: "#0f172a", color: "white", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  PAYSLIP FOR THE MONTH OF {selectedSlip.month.toUpperCase()} {selectedSlip.year}
                </div>
                <div style={{ marginTop: "6px", fontSize: "11px", color: "#475569", display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                  <span>
                    <strong>Pay Period (Date-Wise):</strong>{" "}
                    {selectedSlip.payPeriodStartDate ? formatDate(selectedSlip.payPeriodStartDate) : `01 ${selectedSlip.month.slice(0, 3)} ${selectedSlip.year}`} –{" "}
                    {selectedSlip.payPeriodEndDate ? formatDate(selectedSlip.payPeriodEndDate) : `${selectedSlip.totalDaysInMonth || 30} ${selectedSlip.month.slice(0, 3)} ${selectedSlip.year}`}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Salary Released Date:</strong>{" "}
                    {selectedSlip.salaryReleaseDate || selectedSlip.paymentDate ? formatDate(selectedSlip.salaryReleaseDate || selectedSlip.paymentDate) : `${selectedSlip.totalDaysInMonth || 30} ${selectedSlip.month.slice(0, 3)} ${selectedSlip.year}`}
                  </span>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              {(() => {
                const emp: any = selectedSlip.employeeId;
                const empName = emp?.firstName ? `${emp.firstName} ${emp.lastName}` : "Employee";
                const empCode = emp?.employeeCode || "EMP-1005";
                const designation = emp?.designation || "Staff";
                const department = emp?.departmentId?.name || "General";
                const email = emp?.userId?.email || "employee@hrms-demo.com";

                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "14px 18px",
                      marginBottom: "16px",
                      fontSize: "12px",
                      background: "#f8fafc",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>Employee Name:</span>
                        <strong style={{ color: "#0f172a" }}>{empName}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>Employee Code:</span>
                        <strong>{empCode}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>Designation:</span>
                        <strong>{designation}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>Department:</span>
                        <strong>{department}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Annual Package (CTC):</span>
                        <strong style={{ color: "#2563eb" }}>
                          {formatCurrency(selectedSlip.packageAnnualCtc || selectedSlip.grossSalary * 12)} ({((selectedSlip.packageAnnualCtc || selectedSlip.grossSalary * 12) / 100000).toFixed(2)} LPA)
                        </strong>
                      </div>
                    </div>

                    <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>Bank Account:</span>
                        <strong>HDFC Bank (•••• {selectedSlip.bankAccountLast4 || "8942"})</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>PAN Number:</span>
                        <strong>{selectedSlip.panNumber || "ABCDE1234F"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>UAN Number:</span>
                        <strong>{selectedSlip.uanNumber || "100984729104"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#64748b" }}>Email ID:</span>
                        <strong>{email}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Increment Status:</span>
                        <span style={{ fontWeight: 700, color: (selectedSlip.incrementPercentage || 0) > 0 ? "#059669" : "#334155" }}>
                          {selectedSlip.incrementStatus || "ACTIVE PACKAGE"} {selectedSlip.incrementPercentage ? `(+${selectedSlip.incrementPercentage}%)` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Attendance Breakdown Grid */}
              <div
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "11px",
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  textAlign: "center",
                  background: "#ffffff",
                }}
              >
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Month Days</span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>{selectedSlip.totalDaysInMonth || 30}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Present Days</span>
                  <strong style={{ fontSize: "13px", color: "#059669" }}>{selectedSlip.presentDays || 22}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Paid Holidays</span>
                  <strong style={{ fontSize: "13px", color: "#059669" }}>{selectedSlip.holidaysCount || 2}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Paid Leaves</span>
                  <strong style={{ fontSize: "13px", color: "#059669" }}>{selectedSlip.paidLeaveDays || 0}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Late Marks / LOP</span>
                  <strong style={{ fontSize: "13px", color: (selectedSlip.lopDays || 0) > 0 ? "#dc2626" : "#64748b" }}>
                    {selectedSlip.lateMarksCount || 0} ({selectedSlip.lopDays || 0}d)
                  </strong>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: "4px", padding: "2px" }}>
                  <span style={{ color: "#166534", display: "block", fontWeight: 600 }}>Payable Days</span>
                  <strong style={{ fontSize: "13px", color: "#166534" }}>
                    {selectedSlip.payableDays || selectedSlip.totalDaysInMonth}
                  </strong>
                </div>
              </div>

              {/* Earnings vs Deductions Dual Table */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  border: "1px solid #0f172a",
                  borderRadius: "6px",
                  overflow: "hidden",
                  marginBottom: "16px",
                  fontSize: "12px",
                }}
              >
                {/* Earnings Column */}
                <div style={{ borderRight: "1px solid #0f172a" }}>
                  <div style={{ background: "#0f172a", color: "white", padding: "8px 14px", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                    <span>EARNINGS</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Basic Salary (50%)</span>
                      <strong>{formatCurrency(selectedSlip.basicSalary)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>House Rent Allowance (HRA)</span>
                      <strong>{formatCurrency(selectedSlip.hra)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Special / Flexi Allowance</span>
                      <strong>{formatCurrency(selectedSlip.specialAllowance)}</strong>
                    </div>
                    {(selectedSlip.incentives || 0) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#059669" }}>
                        <span>Performance Incentives / Bonus</span>
                        <strong>+{formatCurrency(selectedSlip.incentives || 0)}</strong>
                      </div>
                    )}
                    {(selectedSlip.reimbursements || 0) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#2563eb" }}>
                        <span>Expense Reimbursements / Claims</span>
                        <strong>+{formatCurrency(selectedSlip.reimbursements || 0)}</strong>
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>
                      <span>TOTAL GROSS EARNED</span>
                      <span>{formatCurrency(selectedSlip.grossSalary + (selectedSlip.incentives || 0) + (selectedSlip.reimbursements || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Column */}
                <div>
                  <div style={{ background: "#0f172a", color: "white", padding: "8px 14px", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                    <span>DEDUCTIONS</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Provident Fund (PF)</span>
                      <strong>{selectedSlip.pfDeduction > 0 ? formatCurrency(selectedSlip.pfDeduction) : "₹0 (N/A)"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Tax Deducted at Source (TDS)</span>
                      <strong>{formatCurrency(selectedSlip.taxDeduction)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Professional Tax (PT)</span>
                      <strong>{formatCurrency(selectedSlip.professionalTax)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Loss of Pay (LOP) Deduction</span>
                      <strong style={{ color: selectedSlip.lopDeduction > 0 ? "#dc2626" : "inherit" }}>
                        {formatCurrency(selectedSlip.lopDeduction || 0)}
                      </strong>
                    </div>
                    {(selectedSlip.otherDeductions || 0) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#dc2626" }}>
                        <span>Other Deductions / Advance</span>
                        <strong>−{formatCurrency(selectedSlip.otherDeductions || 0)}</strong>
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "13px", color: "#dc2626" }}>
                      <span>TOTAL DEDUCTIONS</span>
                      <span>{formatCurrency(selectedSlip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight Box */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "2px solid #16a34a",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    NET TAKE-HOME PAY (DISBURSED)
                  </span>
                  <div style={{ fontSize: "13px", color: "#14532d", fontWeight: 600, marginTop: "2px" }}>
                    {numberToWordsINR(selectedSlip.netSalary)}
                  </div>
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#166534" }}>
                  {formatCurrency(selectedSlip.netSalary)}
                </div>
              </div>

              {/* Payment Disbursement & Proof Details */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  marginBottom: "16px",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CreditCard size={16} color="#2563eb" /> Disbursement & Payment Proof Record
                  </strong>
                  <span
                    className={`status-badge ${
                      selectedSlip.status === "PAID"
                        ? "status-active"
                        : selectedSlip.status === "PROCESSED"
                        ? "status-notice"
                        : "status-leave"
                    }`}
                  >
                    {selectedSlip.status}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Paid Via:</span>
                    <strong style={{ color: "#0f172a" }}>{selectedSlip.paidVia || "Bank Transfer (NEFT/RTGS)"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Payment Date:</span>
                    <strong>{selectedSlip.paymentDate ? new Date(selectedSlip.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Transaction / UTR Ref:</span>
                    <strong>{selectedSlip.paymentReference || "—"}</strong>
                  </div>
                </div>

                <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {selectedSlip.paidProofUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "11px" }}>✓ Payment Proof Attached:</span>
                      <button
                        type="button"
                        onClick={() => setProofPreviewModal({ url: selectedSlip.paidProofUrl!, name: selectedSlip.paidProofName || "Payment Proof" })}
                        style={{ padding: "4px 10px", fontSize: "11px", fontWeight: 600, background: "#2563eb", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <Eye size={12} /> View / Download Proof
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>No payment receipt attached yet.</span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const slip = selectedSlip;
                      setSelectedSlip(null);
                      handleOpenPayment(slip);
                    }}
                    style={{ padding: "4px 10px", fontSize: "11px", fontWeight: 600, background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "5px", cursor: "pointer" }}
                  >
                    💳 Update Payment & Proof
                  </button>
                </div>
              </div>

              {/* Signatures & Seal Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: "24px",
                  paddingTop: "16px",
                  fontSize: "11px",
                  color: "#64748b",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 2px" }}>• This is a system-generated computer slip and does not require a physical signature.</p>
                  <p style={{ margin: 0 }}>• Confidential — For employee use only.</p>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "120px", height: "40px", borderBottom: "1px solid #0f172a", margin: "0 auto 6px" }}></div>
                  <strong style={{ color: "#0f172a", fontSize: "11px" }}>Authorized Signatory</strong>
                  <span style={{ display: "block", color: "#64748b", fontSize: "10px" }}>HR & Payroll Department</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Salary Slip Modal (Manual Entry for Base Salary, Incentive, Tax/TDS, Other Deductions) */}
      {editingSlip && (() => {
        const previewBase = Number(editForm.baseSalary) || 0;
        const previewIncentives = Number(editForm.incentives) || 0;
        const previewReimb = Number(editForm.reimbursements) || 0;
        const previewEarnings = previewBase + previewIncentives + previewReimb;

        const previewTax = Number(editForm.taxDeduction) || 0;
        const previewOther = Number(editForm.otherDeductions) || 0;
        const previewPf = Number(editForm.pfDeduction) || 0;
        // Total deductions directly from form (no hidden professional tax or LOP)
        const previewDeductions = previewTax + previewOther + previewPf;
        const previewNet = Math.max(0, previewEarnings - previewDeductions);

        const emp: any = editingSlip.employeeId;
        const empName = emp?.firstName ? `${emp.firstName} ${emp.lastName}` : "Employee";
        const empCode = emp?.employeeCode || "";

        return (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal" style={{ maxWidth: "620px", padding: "24px" }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Edit size={18} color="#2563eb" /> Adjust Employee Compensation
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {empName} ({empCode}) • Manual entry for Base Salary, Incentives, Tax/TDS & Other Deductions
                  </p>
                </div>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setEditingSlip(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div style={{ padding: "16px 0 8px" }}>
                  {/* Info notice about default ₹0 deductions */}
                  <div
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: "16px",
                      fontSize: "12px",
                      color: "#1e40af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <strong>ℹ️ Deductions Default to ₹0:</strong> Deductions will only apply if manually specified.
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm({
                          ...editForm,
                          taxDeduction: 0,
                          otherDeductions: 0,
                          pfDeduction: 0,
                        })
                      }
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "#ffffff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        borderRadius: "5px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Clear Deductions to ₹0
                    </button>
                  </div>

                  {/* Current Package & Increment status preview */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "16px",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Annual CTC Package</span>
                      <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                        {formatCurrency(previewBase * 12)}
                      </strong>
                      <small style={{ color: "#2563eb", fontWeight: 600, display: "block" }}>
                        {((previewBase * 12) / 100000).toFixed(2)} LPA
                      </small>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Pay Period (Date-Wise)</span>
                      <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                        01 {editingSlip.month.slice(0, 3)} – {editingSlip.totalDaysInMonth || 30} {editingSlip.month.slice(0, 3)} {editingSlip.year}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Salary Released Date</span>
                      <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                        {editingSlip.salaryReleaseDate ? formatDate(editingSlip.salaryReleaseDate) : `${editingSlip.totalDaysInMonth || 30} ${editingSlip.month.slice(0, 3)} ${editingSlip.year}`}
                      </strong>
                    </div>

                    {editingSlip.previousSalary && editingSlip.previousSalary > 0 && previewBase !== editingSlip.previousSalary && (
                      <div style={{ background: previewBase > editingSlip.previousSalary ? "#ecfdf5" : "#fef2f2", border: `1px solid ${previewBase > editingSlip.previousSalary ? "#a7f3d0" : "#fecaca"}`, padding: "6px 8px", borderRadius: "6px" }}>
                        <span style={{ fontSize: "10px", color: previewBase > editingSlip.previousSalary ? "#059669" : "#dc2626", fontWeight: 700, display: "block" }}>
                          {previewBase > editingSlip.previousSalary ? "📈 Increment Hike" : "Revised"}
                        </span>
                        <strong style={{ fontSize: "12px", color: previewBase > editingSlip.previousSalary ? "#059669" : "#dc2626" }}>
                          {previewBase > editingSlip.previousSalary ? "+" : ""}{Math.round(((previewBase - editingSlip.previousSalary) / editingSlip.previousSalary) * 100)}%
                        </strong>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      1. Compensation & Additions
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
                      <div className="form-group" style={{ gridColumn: "span 2" }}>
                        <label style={{ fontWeight: 700, color: "#0f172a" }}>
                          Base Salary (₹) [Monthly Base CTC]
                        </label>
                        <input
                          type="number"
                          value={editForm.baseSalary}
                          onChange={(e) =>
                            setEditForm({ ...editForm, baseSalary: Number(e.target.value) })
                          }
                          style={{ fontWeight: 700, color: "#2563eb", fontSize: "15px", background: "#f8fafc" }}
                          placeholder="e.g. 50000"
                          required
                        />
                        <small style={{ color: "#64748b", fontSize: "11px" }}>
                          Auto-computes Basic (50%), HRA (25%), Special Allowance (25%)
                        </small>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: 700, color: "#059669" }}>
                          Incentives & Bonus (₹)
                        </label>
                        <input
                          type="number"
                          value={editForm.incentives}
                          onChange={(e) =>
                            setEditForm({ ...editForm, incentives: Number(e.target.value) })
                          }
                          placeholder="0 (No incentive)"
                        />
                        <small style={{ color: "#64748b", fontSize: "11px" }}>Performance bonus or commission</small>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: 600, color: "#334155" }}>
                          Expense Reimbursements (₹)
                        </label>
                        <input
                          type="number"
                          value={editForm.reimbursements}
                          onChange={(e) =>
                            setEditForm({ ...editForm, reimbursements: Number(e.target.value) })
                          }
                          placeholder="0"
                        />
                        <small style={{ color: "#64748b", fontSize: "11px" }}>Approved claims or travel</small>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      2. Deductions (Defaults to ₹0)
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
                      <div className="form-group">
                        <label style={{ fontWeight: 700, color: "#dc2626" }}>
                          Tax / TDS Deduction (₹)
                        </label>
                        <input
                          type="number"
                          value={editForm.taxDeduction}
                          onChange={(e) =>
                            setEditForm({ ...editForm, taxDeduction: Number(e.target.value) })
                          }
                          placeholder="0 (Default: ₹0)"
                        />
                        <small style={{ color: "#64748b", fontSize: "11px" }}>Tax withholding (default ₹0)</small>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: 700, color: "#dc2626" }}>
                          Other Deductions / Advance (₹)
                        </label>
                        <input
                          type="number"
                          value={editForm.otherDeductions}
                          onChange={(e) =>
                            setEditForm({ ...editForm, otherDeductions: Number(e.target.value) })
                          }
                          placeholder="0 (Default: ₹0)"
                        />
                        <small style={{ color: "#64748b", fontSize: "11px" }}>Salary advance or other cuts (default ₹0)</small>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: 600, color: "#475569" }}>
                          PF Deduction (₹) [Optional]
                        </label>
                        <input
                          type="number"
                          value={editForm.pfDeduction}
                          onChange={(e) =>
                            setEditForm({ ...editForm, pfDeduction: Number(e.target.value) })
                          }
                          placeholder="0 (Default: ₹0)"
                        />
                        <small style={{ color: "#64748b", fontSize: "11px" }}>Employee PF if applicable (default ₹0)</small>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: 600, color: "#475569" }}>Notes / Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g. Compensation adjusted"
                          value={editForm.notes}
                          onChange={(e) =>
                            setEditForm({ ...editForm, notes: e.target.value })
                          }
                        />
                        <small style={{ color: "#64748b", fontSize: "11px" }}>Recorded in salary slip audit</small>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Calculation Summary Box */}
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        CALCULATED NET TAKE-HOME PAY
                      </span>
                      <div style={{ fontSize: "12px", color: "#15803d", marginTop: "3px" }}>
                        Earnings ({formatCurrency(previewEarnings)}) − Deductions ({formatCurrency(previewDeductions)})
                      </div>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803d" }}>
                      {formatCurrency(previewNet)}
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditingSlip(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Saving..." : "Save Compensation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Disburse & Upload Payment Proof Modal */}
      {paymentSlip && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div className="modal" style={{ maxWidth: "600px", padding: "26px" }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={20} color="#2563eb" /> Record Disbursed Salary & Payment Proof
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Disbursement details for {paymentSlip.month} {paymentSlip.year} • Net: {formatCurrency(paymentSlip.netSalary)}
                </p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setPaymentSlip(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", padding: "16px 0" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Payment Status</label>
                  <select
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 600 }}
                  >
                    <option value="PAID">PAID (Disbursed to Employee)</option>
                    <option value="PROCESSED">PROCESSED (Under Bank Processing)</option>
                    <option value="PENDING">PENDING (On Hold / Awaiting Release)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Paid Via (Payment Mode)</label>
                  <select
                    value={paymentForm.paidVia}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidVia: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Direct Deposit (Corporate NetBanking)">Direct Deposit (Corporate NetBanking)</option>
                    <option value="UPI (GPay / PhonePe / Paytm)">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="IMPS Immediate Payment">IMPS Immediate Payment</option>
                    <option value="Company Cheque">Company Cheque</option>
                    <option value="Cash">Cash Voucher</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>

                {paymentForm.paidVia === "Other" && (
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Custom Payment Method</label>
                    <input
                      type="text"
                      placeholder="e.g. Wire Transfer / Third-party Escrow"
                      value={paymentForm.customPaidVia}
                      onChange={(e) => setPaymentForm({ ...paymentForm, customPaidVia: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Transaction / UTR Reference ID</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR20260928198302"
                    value={paymentForm.paymentReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                {/* Upload Paid Proof */}
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <Paperclip size={15} color="#2563eb" /> Upload Payment Proof (Receipt / Screenshot / Bank Advise)
                  </label>
                  <div
                    style={{
                      border: "2px dashed #cbd5e1",
                      borderRadius: "10px",
                      padding: "16px",
                      textAlign: "center",
                      background: "#f8fafc",
                    }}
                  >
                    {paymentForm.paidProofUrl ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                          {paymentForm.paidProofUrl.startsWith("data:image") ? (
                            <img src={paymentForm.paidProofUrl} alt="Proof" style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                          ) : (
                            <div style={{ width: "42px", height: "42px", background: "#eff6ff", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                              <FileText size={22} />
                            </div>
                          )}
                          <div style={{ textAlign: "left" }}>
                            <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>
                              {paymentForm.paidProofName || "Uploaded Payment Receipt"}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>✓ Proof Attached</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setProofPreviewModal({ url: paymentForm.paidProofUrl, name: paymentForm.paidProofName || "Payment Proof" })}
                            style={{ padding: "6px 10px", fontSize: "12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentForm({ ...paymentForm, paidProofUrl: "", paidProofName: "" })}
                            style={{ padding: "6px 10px", fontSize: "12px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="paid-proof-upload"
                          accept="image/*,application/pdf"
                          onChange={handleProofFileUpload}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor="paid-proof-upload"
                          style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
                        >
                          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                            <Upload size={20} />
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#2563eb" }}>
                            Click to choose or browse receipt / payment proof file
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Supports PNG, JPG, JPEG or PDF (Max 6MB)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontWeight: 600 }}>Disbursement Notes / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Disbursed through corporate batch #04"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPaymentSlip(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingPayment}
                >
                  {savingPayment ? "Saving..." : "Save Payment & Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Queries & Disputes Resolution Modal for HR */}
      {queryModalSlip && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div className="modal" style={{ maxWidth: "680px", padding: "26px" }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={20} color="#f59e0b" /> Employee Queries & Disputes
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Slip: {queryModalSlip.month} {queryModalSlip.year} • {(queryModalSlip.employeeId as any)?.firstName} {(queryModalSlip.employeeId as any)?.lastName} ({(queryModalSlip.employeeId as any)?.employeeCode})
                </p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => { setQueryModalSlip(null); setRespondingQueryId(null); }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "16px 0", maxHeight: "65vh", overflowY: "auto" }}>
              {(!queryModalSlip.queries || queryModalSlip.queries.length === 0) ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  <CheckCircle2 size={36} color="#16a34a" style={{ margin: "0 auto 10px" }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No queries raised by employee for this salary slip.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {queryModalSlip.queries.map((q) => (
                    <div
                      key={q._id}
                      style={{
                        border: q.status === "OPEN" ? "1.5px solid #f59e0b" : q.status === "RESOLVED" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        background: q.status === "OPEN" ? "#fffbeb" : "#ffffff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", background: "#e0e7ff", color: "#4338ca" }}>
                            {q.queryType}
                          </span>
                          <strong style={{ fontSize: "14px", color: "#0f172a" }}>{q.subject}</strong>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "12px",
                            background: q.status === "OPEN" ? "#fef3c7" : q.status === "RESOLVED" ? "#dcfce7" : q.status === "IN_REVIEW" ? "#e0f2fe" : "#fee2e2",
                            color: q.status === "OPEN" ? "#b45309" : q.status === "RESOLVED" ? "#15803d" : q.status === "IN_REVIEW" ? "#0369a1" : "#b91c1c",
                          }}
                        >
                          {q.status}
                        </span>
                      </div>

                      <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#334155", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                        {q.description}
                      </p>

                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>
                        Raised on: {new Date(q.raisedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                        {q.resolvedAt && ` • Resolved on: ${new Date(q.resolvedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`}
                      </div>

                      {q.hrRemarks && (
                        <div style={{ background: "#f8fafc", borderLeft: "3px solid #2563eb", padding: "10px 14px", borderRadius: "0 6px 6px 0", marginBottom: "12px" }}>
                          <strong style={{ fontSize: "12px", color: "#1e40af", display: "block", marginBottom: "2px" }}>HR Resolution / Remarks:</strong>
                          <span style={{ fontSize: "13px", color: "#334155" }}>{q.hrRemarks}</span>
                        </div>
                      )}

                      {/* Respond action */}
                      {respondingQueryId === q._id ? (
                        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                          <div style={{ marginBottom: "10px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Update Query Status:</label>
                            <select
                              value={hrResponseForm.status}
                              onChange={(e) => setHrResponseForm({ ...hrResponseForm, status: e.target.value as any })}
                              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            >
                              <option value="IN_REVIEW">IN_REVIEW (Investigating with Accounts)</option>
                              <option value="RESOLVED">RESOLVED (Action Taken & Verified)</option>
                              <option value="REJECTED">REJECTED (Calculation Confirmed Correct)</option>
                              <option value="OPEN">OPEN</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: "10px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>HR Response / Remarks:</label>
                            <textarea
                              rows={3}
                              value={hrResponseForm.hrRemarks}
                              onChange={(e) => setHrResponseForm({ ...hrResponseForm, hrRemarks: e.target.value })}
                              placeholder="Write explanation or confirm correction made (e.g. Added ₹5,000 incentive, updated base salary)..."
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => setRespondingQueryId(null)}
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={savingQueryResponse}
                              onClick={() => handleSaveQueryResponse(q._id)}
                              style={{ padding: "6px 14px", fontSize: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                            >
                              {savingQueryResponse ? "Saving..." : "Save Response"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setRespondingQueryId(q._id);
                              setHrResponseForm({
                                status: q.status === "OPEN" ? "RESOLVED" : q.status,
                                hrRemarks: q.hrRemarks || "",
                              });
                            }}
                            style={{ padding: "5px 12px", fontSize: "12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                          >
                            💬 Respond / Update Status
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => {
                  const slipToEdit = queryModalSlip;
                  setQueryModalSlip(null);
                  handleOpenEdit(slipToEdit);
                }}
                style={{ padding: "8px 14px", fontSize: "13px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
              >
                ✏️ Adjust Base Salary / Deductions for this Employee
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => { setQueryModalSlip(null); setRespondingQueryId(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Preview Modal */}
      {proofPreviewModal && (
        <div className="modal-overlay" style={{ zIndex: 1400 }}>
          <div className="modal" style={{ maxWidth: "680px", padding: "20px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "16px" }}>{proofPreviewModal.name}</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setProofPreviewModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: "center", padding: "16px 0", maxHeight: "70vh", overflowY: "auto" }}>
              {proofPreviewModal.url.startsWith("data:image") || proofPreviewModal.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img
                  src={proofPreviewModal.url}
                  alt="Payment Proof"
                  style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
              ) : (
                <div style={{ padding: "40px 20px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <FileText size={48} color="#2563eb" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontWeight: 600, color: "#0f172a" }}>PDF / Document Payment Proof Attached</p>
                  <a
                    href={proofPreviewModal.url}
                    download={proofPreviewModal.name || "Payment_Proof.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="primary-button"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", marginTop: "10px" }}
                  >
                    Download / Open Proof Document
                  </a>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <a
                href={proofPreviewModal.url}
                download={proofPreviewModal.name || "Payment_Proof"}
                target="_blank"
                rel="noreferrer"
                className="secondary-button"
                style={{ textDecoration: "none" }}
              >
                Download File
              </a>
              <button
                type="button"
                className="primary-button"
                onClick={() => setProofPreviewModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
