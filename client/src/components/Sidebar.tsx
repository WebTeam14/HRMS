import {
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarCheck,
  Building2,
  Briefcase,
  Calendar,
  Layers,
  FileText,
  LogOut,
  PartyPopper,
  CreditCard,
  LifeBuoy,
  ClipboardList,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();

  const isManagement =
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "CEO" ||
    user?.role === "MANAGER";

  const isHrOrAdmin =
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "CEO";

  const workspaceNav = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Profile",
      path: "/profile",
      icon: UserCircle,
    },
    ...(isManagement
      ? [
          {
            label: "Employees",
            path: "/employees",
            icon: Users,
          },
          {
            label: "Attendance",
            path: "/attendance",
            icon: CalendarCheck,
          },
          {
            label: "Leave Management",
            path: "/leave/management",
            icon: Calendar,
          },
          {
            label: "Work Updates",
            path: "/work-updates/management",
            icon: FileText,
          },
          {
            label: "Holidays",
            path: "/holidays",
            icon: PartyPopper,
          },
          {
            label: "Directory",
            path: "/directory",
            icon: Users,
          },
          ...(user?.role === "HR" || user?.role === "ACCOUNTS" || user?.role === "ADMIN" || user?.role === "CEO"
            ? [
                {
                  label: "Payroll Management",
                  path: "/payroll/management",
                  icon: CreditCard,
                },
              ]
            : [
                {
                  label: "My Payslips",
                  path: "/my-payslips",
                  icon: CreditCard,
                },
              ]),
          {
            label: "Helpdesk",
            path: "/helpdesk",
            icon: LifeBuoy,
          },
          {
            label: "Task Board",
            path: "/tasks/management",
            icon: ClipboardList,
          },
        ]
      : [
          {
            label: "Attendance",
            path: "/my-attendance",
            icon: CalendarCheck,
          },
          {
            label: "My Leave",
            path: "/my-leave",
            icon: Calendar,
          },
          {
            label: "My Work Updates",
            path: "/my-work-updates",
            icon: FileText,
          },
          {
            label: "Holidays",
            path: "/holidays",
            icon: PartyPopper,
          },
          {
            label: "Directory",
            path: "/directory",
            icon: Users,
          },
          {
            label: "My Payslips",
            path: "/my-payslips",
            icon: CreditCard,
          },
          {
            label: "Helpdesk",
            path: "/helpdesk",
            icon: LifeBuoy,
          },
          {
            label: "My Tasks",
            path: "/my-tasks",
            icon: ClipboardList,
          },
        ]),
  ];

  const organizationNav = isHrOrAdmin
    ? [
        {
          label: "Departments",
          path: "/departments",
          icon: Building2,
        },
        {
          label: "Designations",
          path: "/designations",
          icon: Briefcase,
        },
        {
          label: "Leave Types",
          path: "/leave/types",
          icon: Layers,
        },
      ]
    : [];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">T</div>

        <div>
          <strong>Technoriya</strong>
          <span>eTechnologies Pvt Ltd</span>
        </div>
      </div>

      {/* Workspace Navigation */}
      <div className="sidebar-section">
        <span className="section-label">WORKSPACE</span>

        <nav>
          {workspaceNav.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Organization Section */}
        {organizationNav.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <span className="section-label">ORGANIZATION</span>

            <nav>
              {organizationNav.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;