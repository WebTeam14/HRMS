import { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  X,
  CreditCard,
  ShieldCheck,
  Building,
  Eye,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  Send,
} from "lucide-react";
import { getMyPayslips, raiseSalarySlipQuery, formatCurrency } from "../../services/payrollService";
import type { SalarySlip, SalarySummary } from "../../types";

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

const MyPayslips = () => {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [summary, setSummary] = useState<SalarySummary | null>(null);
  const [year, setYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  // Proof Preview Modal State
  const [proofPreviewModal, setProofPreviewModal] = useState<{ url: string; name: string } | null>(null);

  // Raise Query / View Queries Modal State
  const [querySlip, setQuerySlip] = useState<SalarySlip | null>(null);
  const [queryForm, setQueryForm] = useState({
    queryType: "Base Salary Mismatch",
    subject: "",
    description: "",
  });
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const [querySuccess, setQuerySuccess] = useState<string | null>(null);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyPayslips(year);
      setSlips(res.data);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load salary slips");
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!querySlip || !queryForm.subject.trim() || !queryForm.description.trim()) return;

    try {
      setSubmittingQuery(true);
      setError(null);
      setQuerySuccess(null);
      const res = await raiseSalarySlipQuery(querySlip._id, {
        queryType: queryForm.queryType,
        subject: queryForm.subject.trim(),
        description: queryForm.description.trim(),
      });

      setQuerySlip(res.data);
      setQueryForm({ queryType: "Base Salary Mismatch", subject: "", description: "" });
      setQuerySuccess("Your query/request has been submitted to HR. HR will review and take needful action.");
      await loadPayslips();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit query to HR");
    } finally {
      setSubmittingQuery(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [year]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="payslips-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>My Payslips & Compensation</h1>
          <p>View monthly salary statements, itemized earnings, and tax deductions</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <option value={2026}>Year 2026</option>
            <option value={2025}>Year 2025</option>
          </select>
        </div>
      </div>

      {/* Annual Summary KPI Cards */}
      {summary && (
        <div className="dashboard-cards" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              <CreditCard size={20} />
            </div>
            <div className="stat-content">
              <span>YTD Net Pay</span>
              <strong>{formatCurrency(summary.totalNet)}</strong>
              <small>Total deposited in {year}</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Building size={20} />
            </div>
            <div className="stat-content">
              <span>YTD Gross Earnings</span>
              <strong>{formatCurrency(summary.totalGross)}</strong>
              <small>Total CTC compensation</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
              <ShieldCheck size={20} />
            </div>
            <div className="stat-content">
              <span>Total Tax (TDS)</span>
              <strong>{formatCurrency(summary.totalTax)}</strong>
              <small>Income tax withheld</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FileText size={20} />
            </div>
            <div className="stat-content">
              <span>PF Contribution</span>
              <strong>{formatCurrency(summary.totalPf)}</strong>
              <small>Employee provident fund</small>
            </div>
          </div>
        </div>
      )}

      {/* Statements Table */}
      <div className="details-card" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>Monthly Salary Statements</h2>
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>
              Official softcopy compensation breakdown for financial year {year}
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
            {slips.length} Statements
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading payslips...
          </div>
        ) : error ? (
          <div style={{ padding: "30px", color: "#dc2626", background: "#fef2f2" }}>
            {error}
          </div>
        ) : slips.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            No payslips available for year {year}.
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month & Year</th>
                  <th>Present / Paid Days</th>
                  <th>Late Marks</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Take-Home</th>
                  <th>Status & Payment</th>
                  <th>Queries & Issues</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip: SalarySlip) => (
                  <tr key={slip._id}>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                        {slip.month} {slip.year}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#334155" }}>
                        {slip.payableDays || slip.totalDaysInMonth} / {slip.totalDaysInMonth || 30} Days
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: (slip.lateMarksCount || 0) >= 3 ? 600 : 400,
                          color: (slip.lateMarksCount || 0) >= 3 ? "#dc2626" : "#64748b",
                        }}
                      >
                        {slip.lateMarksCount || 0}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a" }}>
                        {formatCurrency(slip.grossSalary - (slip.lopDeduction || 0))}
                      </strong>
                    </td>
                    <td style={{ color: "#dc2626" }}>
                      −{formatCurrency(slip.totalDeductions)}
                    </td>
                    <td>
                      <strong style={{ color: "#059669", fontSize: "14px" }}>
                        {formatCurrency(slip.netSalary)}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <span
                          className={`status-badge ${
                            slip.status === "PAID"
                              ? "status-active"
                              : slip.status === "PROCESSED"
                              ? "status-notice"
                              : "status-leave"
                          }`}
                        >
                          {slip.status}
                        </span>
                        {slip.status === "PAID" && (
                          <div style={{ marginTop: "4px", fontSize: "11px", color: "#64748b" }}>
                            <span style={{ display: "block", color: "#0f172a", fontWeight: 600 }}>
                              {slip.paidVia || "Bank Transfer"}
                            </span>
                            {slip.paidProofUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setProofPreviewModal({
                                    url: slip.paidProofUrl!,
                                    name: slip.paidProofName || "Disbursement Proof",
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
                                <Paperclip size={10} /> View Proof
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {slip.queries && slip.queries.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQuerySlip(slip);
                            setQuerySuccess(null);
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            background: slip.queries.some((q: any) => q.status === "OPEN")
                              ? "#fef3c7"
                              : slip.queries.some((q: any) => q.status === "RESOLVED")
                              ? "#dcfce7"
                              : "#e0f2fe",
                            color: slip.queries.some((q: any) => q.status === "OPEN")
                              ? "#b45309"
                              : slip.queries.some((q: any) => q.status === "RESOLVED")
                              ? "#15803d"
                              : "#0369a1",
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <MessageSquare size={11} />
                          {slip.queries.some((q: any) => q.status === "OPEN")
                            ? "Pending HR"
                            : slip.queries.some((q: any) => q.status === "RESOLVED")
                            ? "HR Resolved"
                            : "In Review"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setQuerySlip(slip);
                            setQuerySuccess(null);
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: "11px",
                            borderRadius: "6px",
                            background: "#f8fafc",
                            color: "#64748b",
                            border: "1px solid #cbd5e1",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <HelpCircle size={11} /> Raise Query
                        </button>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => setSelectedSlip(slip)}
                        style={{ fontSize: "12px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <FileText size={13} /> View Softcopy
                      </button>
                    </td>
                  </tr>
                ))}
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
            {/* Modal Header Action Bar */}
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
                  Official MNC Softcopy Salary Slip
                </strong>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handlePrint}
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

              {/* Official Payment Disbursement Record & Proof */}
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
                    <CreditCard size={16} color="#2563eb" /> Disbursement Details & Proof of Payment
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
                    <span style={{ color: "#64748b", display: "block" }}>Disbursed Via:</span>
                    <strong style={{ color: "#0f172a" }}>{selectedSlip.paidVia || "Bank Transfer (NEFT/RTGS)"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Disbursement Date:</span>
                    <strong>{selectedSlip.paymentDate ? new Date(selectedSlip.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Transaction / UTR Ref:</span>
                    <strong>{selectedSlip.paymentReference || "—"}</strong>
                  </div>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  {selectedSlip.paidProofUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "11px" }}>✓ Payment Proof Attached:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProofPreviewModal({
                            url: selectedSlip.paidProofUrl!,
                            name: selectedSlip.paidProofName || "Disbursement Proof",
                          })
                        }
                        style={{
                          padding: "5px 12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Eye size={12} /> View Payment Receipt
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>No receipt document attached by HR.</span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const slip = selectedSlip;
                      setSelectedSlip(null);
                      setQuerySlip(slip);
                    }}
                    style={{
                      padding: "5px 12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "#fffbeb",
                      color: "#b45309",
                      border: "1px solid #fde68a",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <HelpCircle size={12} /> Have a Query on this Payslip?
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

      {/* Raise Query / Problem Request Modal for Employee */}
      {querySlip && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div className="modal" style={{ maxWidth: "620px", padding: "26px" }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HelpCircle size={20} color="#2563eb" /> Raise Payroll Query or Problem
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Payslip: {querySlip.month} {querySlip.year} • Net Take-Home: {formatCurrency(querySlip.netSalary)}
                </p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => { setQuerySlip(null); setQuerySuccess(null); }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "16px 0", maxHeight: "65vh", overflowY: "auto" }}>
              {querySuccess && (
                <div style={{ padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={16} />
                  <span>{querySuccess}</span>
                </div>
              )}

              {/* Existing queries on this slip */}
              {querySlip.queries && querySlip.queries.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Previous Queries on this Payslip:
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {querySlip.queries.map((q: any) => (
                      <div
                        key={q._id}
                        style={{
                          border: q.status === "RESOLVED" ? "1px solid #86efac" : "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "12px 14px",
                          background: q.status === "RESOLVED" ? "#f0fdf4" : "#f8fafc",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                            [{q.queryType}] {q.subject}
                          </strong>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "10px",
                              background: q.status === "RESOLVED" ? "#dcfce7" : q.status === "OPEN" ? "#fef3c7" : "#e0f2fe",
                              color: q.status === "RESOLVED" ? "#15803d" : q.status === "OPEN" ? "#b45309" : "#0369a1",
                            }}
                          >
                            {q.status}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#334155" }}>
                          {q.description}
                        </p>
                        <small style={{ color: "#64748b", display: "block" }}>
                          Submitted: {new Date(q.raisedAt).toLocaleDateString()}
                        </small>
                        {q.hrRemarks && (
                          <div style={{ marginTop: "8px", background: "white", borderLeft: "3px solid #2563eb", padding: "8px 10px", borderRadius: "0 6px 6px 0", fontSize: "12px" }}>
                            <strong style={{ color: "#1e40af", display: "block" }}>HR Feedback / Action Taken:</strong>
                            <span style={{ color: "#334155" }}>{q.hrRemarks}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form to submit a new query */}
              <form onSubmit={handleRaiseQuery}>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                    <MessageSquare size={16} color="#2563eb" /> Submit a New Query / Problem to HR
                  </h4>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Query Category</label>
                    <select
                      value={queryForm.queryType}
                      onChange={(e) => setQueryForm({ ...queryForm, queryType: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value="Base Salary Mismatch">Base Salary Discrepancy / Mismatch</option>
                      <option value="Incentive Missing / Incorrect">Incentive / Bonus Missing or Incorrect</option>
                      <option value="Tax / TDS Deduction Query">Tax / TDS Deduction Discrepancy</option>
                      <option value="Other Deductions Query">Other Deductions / Advance Recovery Issue</option>
                      <option value="Payment Proof / Transfer Issue">Payment Proof / Bank Credit Issue</option>
                      <option value="General Payroll Query">General Payroll Query</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 performance incentive not credited in September slip"
                      value={queryForm.subject}
                      onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Detailed Problem Description</label>
                    <textarea
                      rows={3}
                      placeholder="Explain the specific issue with dates, expected amounts, or deductions so HR can verify and take needful action..."
                      value={queryForm.description}
                      onChange={(e) => setQueryForm({ ...queryForm, description: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={submittingQuery}
                      className="primary-button"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 16px" }}
                    >
                      <Send size={14} />
                      {submittingQuery ? "Submitting..." : "Send Request to HR"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => { setQuerySlip(null); setQuerySuccess(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Preview Modal for Employee */}
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
                  <p style={{ fontWeight: 600, color: "#0f172a" }}>Official Payment Receipt Document Attached</p>
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

export default MyPayslips;
