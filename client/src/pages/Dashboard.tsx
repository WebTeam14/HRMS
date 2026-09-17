import { useEffect, useState } from "react";
import {
  Users,
  UserCircle,
  CalendarCheck,
  Clock,
  ArrowRight,
  LogIn,
  LogOut,
  CheckCircle2,
  Calendar,
  FileText,
  Plus,
  Edit2,
  MessageSquare,
  Gift,
  DollarSign,
  HelpCircle,
  BookOpen,
  Building2,
  Briefcase,
  Layers,
  Wallet,
  LifeBuoy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTodayAttendance,
  getAttendance,
  checkIn,
  checkOut,
  formatWorkingHours,
  formatTimeIST,
} from "../services/attendanceService";
import {
  getMyLeaveBalances,
  getAllLeaveRequests,
} from "../services/leaveService";
import {
  getMyWorkUpdates,
  getAllWorkUpdates,
} from "../services/workUpdateService";
import {
  getCompanyPayrollOverview,
  formatCurrency,
} from "../services/payrollService";
import { getHolidays } from "../services/holidayService";
import type {
  Attendance,
  AttendanceSummary,
  LeaveBalance,
  LeaveSummary,
  WorkUpdate,
  WorkUpdateSummary,
  Holiday,
} from "../types";

interface PayrollOverviewData {
  totalMonthlyGross: number;
  totalMonthlyNet: number;
  totalMonthlyTds: number;
  totalMonthlyPf: number;
  activePayrollEmployees: number;
  latestMonth: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || "EMPLOYEE";
  const isHr = role === "HR";
  const isManager = role === "MANAGER";
  const isAccounts = role === "ACCOUNTS";
  const isAdmin = role === "ADMIN";
  const isCeo = role === "CEO";
  const isEmployee = role === "EMPLOYEE";

  const isManagement = isHr || isManager || isAccounts || isAdmin || isCeo;

  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [workUpdateSummary, setWorkUpdateSummary] = useState<WorkUpdateSummary | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [payrollOverview, setPayrollOverview] = useState<PayrollOverviewData | null>(null);
  const [nextHoliday, setNextHoliday] = useState<Holiday | null>(null);

  const [todayWorkUpdate, setTodayWorkUpdate] = useState<WorkUpdate | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Management aggregations
      if (isManagement) {
        const [attRes, leaveRes, workRes] = await Promise.all([
          getAttendance({ limit: 1 }),
          getAllLeaveRequests({ limit: 1 }),
          getAllWorkUpdates({ limit: 1 }),
        ]);
        if (attRes.summary) setSummary(attRes.summary);
        if (leaveRes.summary) setLeaveSummary(leaveRes.summary);
        if (workRes.summary) setWorkUpdateSummary(workRes.summary);
      }

      // 2. Financial aggregations for Accounts & CEO
      if (isAccounts || isCeo) {
        try {
          const payrollRes = await getCompanyPayrollOverview();
          if (payrollRes.data) setPayrollOverview(payrollRes.data);
        } catch (e) {
          console.error("Failed to load payroll overview:", e);
        }
      }

      // 3. Employee self-service data
      if (isEmployee) {
        const [balancesRes, workUpdatesRes, holidayRes] = await Promise.all([
          getMyLeaveBalances(),
          getMyWorkUpdates({ limit: 5 }),
          getHolidays({ year: 2026 }),
        ]);
        setLeaveBalances(balancesRes.data);
        if (holidayRes.nextHoliday) setNextHoliday(holidayRes.nextHoliday);

        const todayUpdate = workUpdatesRes.data.find(
          (u) => u.date && u.date.split("T")[0] === todayStr
        );
        setTodayWorkUpdate(todayUpdate || null);
      }

      // 4. Punch record for all users
      const todayRes = await getTodayAttendance();
      setTodayRecord(todayRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await checkIn();
      setTodayRecord(res.data);
      await loadDashboardData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Check-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    const confirmed = window.confirm("Are you sure you want to Check Out for today?");
    if (!confirmed) return;
    try {
      setActionLoading(true);
      const res = await checkOut();
      setTodayRecord(res.data);
      await loadDashboardData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Check-out failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleHeader = () => {
    if (isHr) {
      return {
        title: "Human Resources Workspace",
        subtitle: "Monitor employee lifecycle, company attendance, and pending approvals.",
        tag: "HR Management",
        tagColor: "#ecfdf5",
        tagText: "#059669",
      };
    }
    if (isManager) {
      return {
        title: "Department & Team Leadership",
        subtitle: "Review daily team updates, approve leave requests, and track presence.",
        tag: "Department Manager",
        tagColor: "#eff6ff",
        tagText: "#2563eb",
      };
    }
    if (isAccounts) {
      return {
        title: "Accounts & Financial Payroll",
        subtitle: "Manage company salary disbursements, tax withholding, and compensation.",
        tag: "Finance & Accounts",
        tagColor: "#fef3c7",
        tagText: "#d97706",
      };
    }
    if (isAdmin) {
      return {
        title: "Administration & Operations",
        subtitle: "Configure organizational structure, departments, and system governance.",
        tag: "System Admin",
        tagColor: "#fdf4ff",
        tagText: "#c026d3",
      };
    }
    if (isCeo) {
      return {
        title: "Executive Leadership Dashboard",
        subtitle: "High-level overview of company headcount, presence rate, and operations.",
        tag: "Executive (CEO)",
        tagColor: "#1e293b",
        tagText: "#f8fafc",
      };
    }
    return {
      title: "Employee Self-Service Workspace",
      subtitle: "Welcome back! Manage your daily attendance, tasks, leave, and compensation.",
      tag: "Employee Portal",
      tagColor: "#f0fdfa",
      tagText: "#0d9488",
    };
  };

  const headerInfo = getRoleHeader();

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>{headerInfo.title}</h1>
          <p>{headerInfo.subtitle}</p>
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            background: headerInfo.tagColor,
            color: headerInfo.tagText,
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {headerInfo.tag}
        </div>
      </div>

      {/* 1. ACCOUNTS & FINANCE DASHBOARD STATS */}
      {isAccounts && (
        <div className="dashboard-cards">
          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/payroll/management")}
          >
            <div className="stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
              <Wallet size={20} />
            </div>
            <div className="stat-content">
              <span>Monthly Gross Payroll</span>
              <strong>{payrollOverview ? formatCurrency(payrollOverview.totalMonthlyGross) : "—"}</strong>
              <small>{payrollOverview?.latestMonth || "Monthly total"}</small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/payroll/management")}
          >
            <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-content">
              <span>Net Salary Payout</span>
              <strong>{payrollOverview ? formatCurrency(payrollOverview.totalMonthlyNet) : "—"}</strong>
              <small>Disbursed to employees</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FileText size={20} />
            </div>
            <div className="stat-content">
              <span>Tax (TDS) Withheld</span>
              <strong>{payrollOverview ? formatCurrency(payrollOverview.totalMonthlyTds) : "—"}</strong>
              <small>Statutory tax deduction</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
              <Users size={20} />
            </div>
            <div className="stat-content">
              <span>Active on Payroll</span>
              <strong>{payrollOverview?.activePayrollEmployees ?? summary?.totalActive ?? "—"}</strong>
              <small>Salaried staff count</small>
            </div>
          </div>
        </div>
      )}

      {/* 2. HR & ADMIN & CEO DASHBOARD STATS */}
      {(isHr || isAdmin || isCeo) && (
        <div className="dashboard-cards">
          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/employees")}
          >
            <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              <Users size={20} />
            </div>
            <div className="stat-content">
              <span>Total Active Headcount</span>
              <strong>{summary?.totalActive ?? "—"}</strong>
              <small>Registered employees</small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/attendance")}
          >
            <div className="stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
              <CalendarCheck size={20} />
            </div>
            <div className="stat-content">
              <span>Present Today</span>
              <strong>{summary?.present ?? "—"}</strong>
              <small>Checked in on time</small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/leave/management")}
          >
            <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <span>Pending Leaves</span>
              <strong style={{ color: (leaveSummary?.pending ?? 0) > 0 ? "#d97706" : undefined }}>
                {leaveSummary?.pending ?? "—"}
              </strong>
              <small>Action required in Leave Mgmt</small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/work-updates/management")}
          >
            <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FileText size={20} />
            </div>
            <div className="stat-content">
              <span>Pending Updates</span>
              <strong style={{ color: (workUpdateSummary?.pending ?? 0) > 0 ? "#d97706" : undefined }}>
                {workUpdateSummary?.pending ?? "—"}
              </strong>
              <small>Daily task updates to review</small>
            </div>
          </div>
        </div>
      )}

      {/* 3. IT / DEPARTMENT MANAGER DASHBOARD STATS */}
      {isManager && (
        <div className="dashboard-cards">
          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/attendance")}
          >
            <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <CalendarCheck size={20} />
            </div>
            <div className="stat-content">
              <span>Team Attendance Today</span>
              <strong>{summary?.present ?? "—"}</strong>
              <small>Active & checked in</small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/work-updates/management")}
          >
            <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FileText size={20} />
            </div>
            <div className="stat-content">
              <span>Team Updates to Review</span>
              <strong style={{ color: (workUpdateSummary?.pending ?? 0) > 0 ? "#d97706" : undefined }}>
                {workUpdateSummary?.pending ?? "—"}
              </strong>
              <small>Submitted tasks pending review</small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/leave/management")}
          >
            <div className="stat-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <span>Team Leave Requests</span>
              <strong style={{ color: (leaveSummary?.pending ?? 0) > 0 ? "#d97706" : undefined }}>
                {leaveSummary?.pending ?? "—"}
              </strong>
              <small>Pending manager sign-off</small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/helpdesk")}
          >
            <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              <LifeBuoy size={20} />
            </div>
            <div className="stat-content">
              <span>IT & Support Requests</span>
              <strong>Open</strong>
              <small>Department tickets</small>
            </div>
          </div>
        </div>
      )}

      {/* 4. GENERAL EMPLOYEE DASHBOARD STATS */}
      {isEmployee && (
        <div className="dashboard-cards">
          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/my-attendance")}
          >
            <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <span>Today's Attendance</span>
              <strong>
                {loadingDashboard
                  ? "Loading..."
                  : !todayRecord
                  ? "Not Checked In"
                  : todayRecord.checkOut
                  ? "Completed"
                  : todayRecord.status}
              </strong>
              <small>
                {todayRecord?.checkIn
                  ? `In: ${formatTimeIST(todayRecord.checkIn)}`
                  : "Expected shift 09:30 AM"}
              </small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/my-attendance")}
          >
            <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              <CalendarCheck size={20} />
            </div>
            <div className="stat-content">
              <span>Working Hours</span>
              <strong>
                {todayRecord
                  ? formatWorkingHours(
                      todayRecord.totalWorkingMinutes,
                      Boolean(todayRecord.checkIn && !todayRecord.checkOut)
                    )
                  : "0h 00m"}
              </strong>
              <small>
                {todayRecord?.checkOut
                  ? `Out: ${formatTimeIST(todayRecord.checkOut)}`
                  : "Standard: 8h 00m"}
              </small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/my-leave")}
          >
            <div className="stat-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <span>Leave Balance</span>
              <strong>
                {leaveBalances.length > 0
                  ? `${leaveBalances[0].remainingDays} days`
                  : "9 days"}
              </strong>
              <small>
                {leaveBalances.length > 0
                  ? `${leaveBalances[0].leaveTypeId?.name || "Leave"} remaining`
                  : "Casual Leave available"}
              </small>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (!todayWorkUpdate) {
                navigate("/my-work-updates/new");
              } else if (
                todayWorkUpdate.status === "DRAFT" ||
                todayWorkUpdate.status === "CHANGES_REQUESTED"
              ) {
                navigate(`/my-work-updates/${todayWorkUpdate._id}/edit`);
              } else {
                navigate(`/my-work-updates/${todayWorkUpdate._id}`);
              }
            }}
          >
            <div className="stat-icon" style={{ background: "#fef9c3", color: "#a16207" }}>
              <FileText size={20} />
            </div>
            <div className="stat-content">
              <span>Today's Task Log</span>
              <strong style={{ fontSize: "14px" }}>
                {!todayWorkUpdate
                  ? "Not Logged"
                  : todayWorkUpdate.status === "APPROVED"
                  ? "Approved"
                  : todayWorkUpdate.status === "CHANGES_REQUESTED"
                  ? "Revisions Needed"
                  : todayWorkUpdate.status === "SUBMITTED"
                  ? "Submitted"
                  : "Draft"}
              </strong>
              <small>
                {!todayWorkUpdate
                  ? "Log your activities"
                  : `${todayWorkUpdate.totalHours} hrs recorded`}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Daily Attendance Punch Card (Visible for all roles) */}
      <div
        className="details-card"
        style={{
          marginTop: "20px",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>
            MY DAILY ATTENDANCE PUNCH
          </span>
          <h2 style={{ margin: "3px 0 0", fontSize: "16px", color: "#0f172a" }}>
            {!todayRecord ? (
              "You have not checked in for today yet."
            ) : todayRecord.checkOut ? (
              `Shift completed (${formatWorkingHours(todayRecord.totalWorkingMinutes)})`
            ) : (
              `Checked in at ${formatTimeIST(todayRecord.checkIn)} • Shift in progress`
            )}
          </h2>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {!todayRecord ? (
            <button
              type="button"
              className="primary-button"
              onClick={handleCheckIn}
              disabled={actionLoading || loadingDashboard}
            >
              <LogIn size={16} />
              {actionLoading ? "Checking In..." : "Check In"}
            </button>
          ) : !todayRecord.checkOut ? (
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={actionLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              {actionLoading ? "Checking Out..." : "Check Out"}
            </button>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#059669",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              <CheckCircle2 size={16} /> Checked Out for Today
            </span>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(isManagement ? "/attendance" : "/my-attendance")
            }
          >
            View Attendance Log
          </button>
        </div>
      </div>

      {/* Employee Today's Daily Work Update Action Card */}
      {isEmployee && (
        <div
          className="details-card"
          style={{
            marginTop: "16px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>
              TODAY'S WORK UPDATE
            </span>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", color: "#0f172a" }}>
              {!todayWorkUpdate ? (
                "No work update logged for today yet."
              ) : todayWorkUpdate.status === "DRAFT" ? (
                `Draft in progress (${todayWorkUpdate.totalHours} hrs recorded)`
              ) : todayWorkUpdate.status === "CHANGES_REQUESTED" ? (
                "Manager requested revisions on your update"
              ) : todayWorkUpdate.status === "APPROVED" ? (
                "Today's work update has been approved"
              ) : (
                "Work update submitted and pending manager review"
              )}
            </h2>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {!todayWorkUpdate ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate("/my-work-updates/new")}
              >
                <Plus size={16} />
                Log Daily Update
              </button>
            ) : todayWorkUpdate.status === "DRAFT" ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate(`/my-work-updates/${todayWorkUpdate._id}/edit`)}
              >
                <Edit2 size={16} />
                Continue Draft
              </button>
            ) : todayWorkUpdate.status === "CHANGES_REQUESTED" ? (
              <button
                type="button"
                className="primary-button"
                style={{ background: "#d97706" }}
                onClick={() => navigate(`/my-work-updates/${todayWorkUpdate._id}/edit`)}
              >
                <MessageSquare size={16} />
                Review & Resubmit
              </button>
            ) : (
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate(`/my-work-updates/${todayWorkUpdate._id}`)}
              >
                View Details
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/my-work-updates")}
            >
              All Updates
            </button>
          </div>
        </div>
      )}

      {/* Tailored Quick Actions Section */}
      <div className="dashboard-section" style={{ marginTop: "24px" }}>
        <div className="section-heading">
          <div>
            <h2>Department Quick Actions</h2>
            <p>Access specialized workflows tailored for your role.</p>
          </div>
        </div>

        <div className="quick-actions">
          {/* HR SPECIFIC ACTIONS */}
          {isHr && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/employees")}
              >
                <div className="quick-action-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                  <Users size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Employee Management</strong>
                  <span>Manage employees, onboard & edit</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/leave/management")}
              >
                <div className="quick-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <Calendar size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Leave Approvals</strong>
                  <span>Review & approve leave requests</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/attendance")}
              >
                <div className="quick-action-icon" style={{ background: "#f0fdfa", color: "#0d9488" }}>
                  <CalendarCheck size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Attendance Registry</strong>
                  <span>Track company presence & status</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/payroll/management")}
              >
                <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <DollarSign size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Payroll Management</strong>
                  <span>Calculate salaries, LOP & slips</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/departments")}
              >
                <div className="quick-action-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
                  <Building2 size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Departments</strong>
                  <span>Manage company departments</span>
                </div>
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {/* MANAGER SPECIFIC ACTIONS */}
          {isManager && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/work-updates/management")}
              >
                <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <FileText size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Review Team Tasks</strong>
                  <span>Approve & review daily logs</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/leave/management")}
              >
                <div className="quick-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <Calendar size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Approve Team Leaves</strong>
                  <span>Action team time-off requests</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/attendance")}
              >
                <div className="quick-action-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                  <CalendarCheck size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Team Attendance</strong>
                  <span>Monitor team presence & hours</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/helpdesk")}
              >
                <div className="quick-action-icon" style={{ background: "#faf5ff", color: "#9333ea" }}>
                  <HelpCircle size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Support Helpdesk</strong>
                  <span>Track & resolve team requests</span>
                </div>
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {/* ACCOUNTS SPECIFIC ACTIONS */}
          {isAccounts && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/payroll/management")}
              >
                <div className="quick-action-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                  <DollarSign size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Payroll Management & Register</strong>
                  <span>Manage compensation, LOP & slips</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/directory")}
              >
                <div className="quick-action-icon" style={{ background: "#f0fdfa", color: "#0d9488" }}>
                  <BookOpen size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Company Directory</strong>
                  <span>Staff records & department lookup</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/attendance")}
              >
                <div className="quick-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <CalendarCheck size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Attendance & Loss of Pay</strong>
                  <span>Verify working days for payroll</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/helpdesk")}
              >
                <div className="quick-action-icon" style={{ background: "#faf5ff", color: "#9333ea" }}>
                  <HelpCircle size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Payroll Helpdesk</strong>
                  <span>Resolve employee salary queries</span>
                </div>
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {/* ADMIN SPECIFIC ACTIONS */}
          {isAdmin && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/departments")}
              >
                <div className="quick-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <Building2 size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Departments Management</strong>
                  <span>Configure corporate divisions</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/designations")}
              >
                <div className="quick-action-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
                  <Briefcase size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Designations & Roles</strong>
                  <span>Set job titles and bands</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/leave/types")}
              >
                <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <Layers size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Leave Policies & Types</strong>
                  <span>Configure leave entitlements</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/employees")}
              >
                <div className="quick-action-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                  <Users size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>All System Employees</strong>
                  <span>User accounts & directory</span>
                </div>
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {/* CEO SPECIFIC ACTIONS */}
          {isCeo && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/employees")}
              >
                <div className="quick-action-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                  <Users size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Headcount & Organization</strong>
                  <span>Complete company directory</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/attendance")}
              >
                <div className="quick-action-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                  <CalendarCheck size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Company Presence</strong>
                  <span>Presence analytics & logs</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/work-updates/management")}
              >
                <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <FileText size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Productivity & Work Logs</strong>
                  <span>Daily company work updates</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/my-payslips")}
              >
                <div className="quick-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <DollarSign size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Payroll Summary</strong>
                  <span>Executive compensation view</span>
                </div>
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {/* GENERAL EMPLOYEE SPECIFIC ACTIONS */}
          {isEmployee && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/my-work-updates")}
              >
                <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <FileText size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>My Daily Updates</strong>
                  <span>Log accomplishments & tasks</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/my-leave")}
              >
                <div className="quick-action-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
                  <Calendar size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>My Leave</strong>
                  <span>View balances & apply for time off</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/my-attendance")}
              >
                <div className="quick-action-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                  <CalendarCheck size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>My Attendance</strong>
                  <span>Punch history & working hours</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/my-payslips")}
              >
                <div className="quick-action-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                  <DollarSign size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>My Payslips</strong>
                  <span>Salary breakdown & printable slips</span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/holidays")}
              >
                <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <Gift size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Holidays 2026</strong>
                  <span>
                    {nextHoliday
                      ? `Next: ${nextHoliday.name} (${new Date(nextHoliday.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})`
                      : "Upcoming public & optional holidays"}
                  </span>
                </div>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate("/helpdesk")}
              >
                <div className="quick-action-icon" style={{ background: "#faf5ff", color: "#9333ea" }}>
                  <HelpCircle size={20} />
                </div>
                <div className="quick-action-content">
                  <strong>Helpdesk & Support</strong>
                  <span>Raise IT, HR, or Payroll tickets</span>
                </div>
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {/* UNIVERSAL PROFILE BUTTON */}
          <button
            type="button"
            className="quick-action-card"
            onClick={() => navigate("/profile")}
          >
            <div className="quick-action-icon" style={{ background: "#f8fafc", color: "#334155" }}>
              <UserCircle size={20} />
            </div>
            <div className="quick-action-content">
              <strong>My Profile</strong>
              <span>Manage credentials & personal info</span>
            </div>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;