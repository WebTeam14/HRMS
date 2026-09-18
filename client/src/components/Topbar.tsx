import { useState, useEffect } from "react";
import { Bell, Search, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_COLOR_MAP: Record<string, { bg: string; color: string; border: string }> = {
  CEO: { bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" },
  HR: { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  ADMIN: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
  MANAGER: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  ACCOUNTS: { bg: "#ffedd5", color: "#9a3412", border: "#fed7aa" },
  EMPLOYEE: { bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff" },
};

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      };
      setCurrentDate(now.toLocaleDateString("en-IN", options));
    };
    updateTime();
  }, []);

  const initial = user?.email?.charAt(0).toUpperCase() || "U";
  const userRole = user?.role || "EMPLOYEE";
  const roleStyle = ROLE_COLOR_MAP[userRole] || ROLE_COLOR_MAP.EMPLOYEE;

  return (
    <header className="topbar-enhanced">
      {/* Search & Breadcrumb Bar */}
      <div className="topbar-left">
        <div className="topbar-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search directory, employees, tasks..."
            className="topbar-search-input"
          />
        </div>
      </div>

      {/* Right User Bar */}
      <div className="topbar-actions">
        {/* Online Status Badge */}
        <div className="online-status-pill" title="Active & Online in Technoriya HRMS">
          <span className="online-pulse-dot"></span>
          <span className="online-label">Online</span>
        </div>

        {/* Date Pill */}
        <div className="topbar-date-pill">
          <Calendar size={14} color="#6366f1" />
          <span>{currentDate}</span>
        </div>

        {/* Notification Icon */}
        <button type="button" className="topbar-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-badge-dot"></span>
        </button>

        {/* User Profile Pill */}
        <div
          className="user-profile-pill"
          onClick={() => navigate("/profile")}
          title="Click to view My Profile"
        >
          <div className="avatar-ring">
            <span>{initial}</span>
          </div>

          <div className="user-details-mini">
            <span className="user-email">{user?.email}</span>
            <span
              className="user-role-badge"
              style={{
                background: roleStyle.bg,
                color: roleStyle.color,
                border: `1px solid ${roleStyle.border}`,
              }}
            >
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;