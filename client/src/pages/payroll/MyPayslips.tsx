import { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  X,
  CreditCard,
  ShieldCheck,
  Building,
} from "lucide-react";
import { getMyPayslips, formatCurrency } from "../../services/payrollService";
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
                  <th>Deductions (PF+Tax)</th>
                  <th>Net Take-Home</th>
                  <th>Status</th>
                  <th>Disbursed Date</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => (
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
                    </td>
                    <td style={{ color: "#64748b", fontSize: "13px" }}>
                      {slip.paymentDate
                        ? new Date(slip.paymentDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
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
    </div>
  );
};

export default MyPayslips;
