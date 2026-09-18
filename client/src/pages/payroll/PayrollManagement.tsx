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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getCompanyPayrollSheet,
  calculateMonthlyPayroll,
  publishMonthlyPayroll,
  updateSalarySlip,
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
  const [editingSlip, setEditingSlip] = useState<SalarySlip | null>(null);
  const [editForm, setEditForm] = useState({
    grossSalary: 0,
    incentives: 0,
    reimbursements: 0,
    pfDeduction: 0,
    taxDeduction: 0,
    otherDeductions: 0,
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

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
    setEditForm({
      grossSalary: slip.grossSalary || 50000,
      incentives: slip.incentives || 0,
      reimbursements: slip.reimbursements || 0,
      pfDeduction: slip.pfDeduction || 0,
      taxDeduction: slip.taxDeduction || 0,
      otherDeductions: slip.otherDeductions || 0,
      notes: slip.notes || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip) return;

    try {
      setSavingEdit(true);
      await updateSalarySlip(editingSlip._id, {
        grossSalary: Number(editForm.grossSalary) || 0,
        incentives: Number(editForm.incentives) || 0,
        reimbursements: Number(editForm.reimbursements) || 0,
        pfDeduction: Number(editForm.pfDeduction) || 0,
        taxDeduction: Number(editForm.taxDeduction) || 0,
        otherDeductions: Number(editForm.otherDeductions) || 0,
        notes: editForm.notes,
      });
      setEditingSlip(null);
      await loadPayrollSheet();
      setSuccess("Salary slip & increment adjustments saved successfully!");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update salary slip");
    } finally {
      setSavingEdit(false);
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
              Itemized statement of packages, days worked, deductions, and net take-home
            </p>
          </div>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "6px",
              background: "#f1f5f9",
              color: "#334155",
            }}
          >
            {slips.length} Records
          </span>
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
                  <th>Base Gross</th>
                  <th>Present / Paid</th>
                  <th>Late Marks</th>
                  <th>LOP Days</th>
                  <th>Payable Days</th>
                  <th>Gross Earned</th>
                  <th>Deductions</th>
                  <th>Net Take-Home</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((s) => {
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
                        <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                          {formatCurrency(s.grossSalary)}
                        </strong>
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
                        <div style={{ fontSize: "12px", color: "#dc2626" }}>
                          <span>−{formatCurrency(s.totalDeductions)}</span>
                          <small style={{ display: "block", color: "#94a3b8" }}>
                            PF: {formatCurrency(s.pfDeduction)} • Tax: {formatCurrency(s.taxDeduction)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#059669", fontSize: "14px" }}>
                          {formatCurrency(s.netSalary)}
                        </strong>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSlip(s)}
                            style={{
                              padding: "6px 10px",
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
                          >
                            <FileText size={13} /> Softcopy
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            style={{
                              padding: "6px 8px",
                              fontSize: "12px",
                              background: "#f1f5f9",
                              color: "#334155",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            title="Adjust Allowance / Notes"
                          >
                            <Edit size={13} />
                          </button>
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
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Department:</span>
                        <strong>{department}</strong>
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
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Email ID:</span>
                        <strong>{email}</strong>
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

      {/* Edit Salary Slip Modal */}
      {editingSlip && (() => {
        const previewGross = (Number(editForm.grossSalary) || 0);
        const previewEarnings = previewGross + (Number(editForm.incentives) || 0) + (Number(editForm.reimbursements) || 0);
        const previewDeductions = (editingSlip.lopDeduction || 0) + (Number(editForm.pfDeduction) || 0) + (Number(editForm.taxDeduction) || 0) + (editingSlip.professionalTax || 200) + (Number(editForm.otherDeductions) || 0);
        const previewNet = Math.max(0, previewEarnings - previewDeductions);

        return (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal" style={{ maxWidth: "560px", padding: "24px" }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px" }}>Adjust Employee Compensation</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Update base package (increments), incentives, reimbursements & deductions.
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
                <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", padding: "16px 0" }}>
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>Base Monthly Package / CTC (₹) [Salary Increment]</label>
                    <input
                      type="number"
                      value={editForm.grossSalary}
                      onChange={(e) =>
                        setEditForm({ ...editForm, grossSalary: Number(e.target.value) })
                      }
                      style={{ fontWeight: 700, color: "#2563eb", background: "#f8fafc" }}
                    />
                    <small style={{ color: "#64748b", fontSize: "11px" }}>Actual base monthly package for employee increment / revisions.</small>
                  </div>

                  <div className="form-group">
                    <label>Incentives & Performance Bonus (₹)</label>
                    <input
                      type="number"
                      value={editForm.incentives}
                      onChange={(e) =>
                        setEditForm({ ...editForm, incentives: Number(e.target.value) })
                      }
                      placeholder="e.g. 5000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Expense Reimbursements (₹)</label>
                    <input
                      type="number"
                      value={editForm.reimbursements}
                      onChange={(e) =>
                        setEditForm({ ...editForm, reimbursements: Number(e.target.value) })
                      }
                      placeholder="e.g. 2500"
                    />
                  </div>

                  <div className="form-group">
                    <label>PF Deduction (₹) [Optional]</label>
                    <input
                      type="number"
                      value={editForm.pfDeduction}
                      onChange={(e) =>
                        setEditForm({ ...editForm, pfDeduction: Number(e.target.value) })
                      }
                      placeholder="0 (No PF)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tax Withholding / TDS (₹)</label>
                    <input
                      type="number"
                      value={editForm.taxDeduction}
                      onChange={(e) =>
                        setEditForm({ ...editForm, taxDeduction: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Other Deductions / Advance Recovery (₹)</label>
                    <input
                      type="number"
                      value={editForm.otherDeductions}
                      onChange={(e) =>
                        setEditForm({ ...editForm, otherDeductions: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Notes / Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Salary increment + travel expense reimbursement included..."
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                    />
                  </div>

                  {/* Real-time Calculation Summary Box */}
                  <div
                    style={{
                      gridColumn: "span 2",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                        CALCULATED NET TAKE-HOME
                      </span>
                      <div style={{ fontSize: "11px", color: "#15803d" }}>
                        Total Earnings ({formatCurrency(previewEarnings)}) − Deductions ({formatCurrency(previewDeductions)})
                      </div>
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803d" }}>
                      {formatCurrency(previewNet)}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
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
                    {savingEdit ? "Saving..." : "Save Adjustments"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PayrollManagement;
