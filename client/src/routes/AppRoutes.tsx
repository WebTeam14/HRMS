import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

import Employees from "../pages/employees/Employees";
import EmployeeDetails from "../pages/employees/EmployeeDetails";
import AddEmployee from "../pages/employees/AddEmployee";
import EditEmployee from "../pages/employees/EditEmployee";

import Departments from "../pages/departments/Departments";
import AddDepartment from "../pages/departments/AddDepartment";
import EditDepartment from "../pages/departments/EditDepartment";
import DepartmentDetails from "../pages/departments/DepartmentDetails";

import Designations from "../pages/designations/Designations";
import AddDesignation from "../pages/designations/AddDesignation";
import EditDesignation from "../pages/designations/EditDesignation";

import MyProfile from "../pages/profile/MyProfile";
import ChangePassword from "../pages/profile/ChangePassword";

import MyAttendance from "../pages/attendance/MyAttendance";
import AttendanceList from "../pages/attendance/Attendance";
import AttendanceDetails from "../pages/attendance/AttendanceDetails";

import MyLeave from "../pages/leave/MyLeave";
import ApplyLeave from "../pages/leave/ApplyLeave";
import LeaveRequestDetails from "../pages/leave/LeaveRequestDetails";
import LeaveManagement from "../pages/leave/LeaveManagement";
import LeaveTypes from "../pages/leave/LeaveTypes";
import AddLeaveType from "../pages/leave/AddLeaveType";
import EditLeaveType from "../pages/leave/EditLeaveType";

import MyWorkUpdates from "../pages/workUpdates/MyWorkUpdates";
import CreateWorkUpdate from "../pages/workUpdates/CreateWorkUpdate";
import EditWorkUpdate from "../pages/workUpdates/EditWorkUpdate";
import WorkUpdateDetails from "../pages/workUpdates/WorkUpdateDetails";
import WorkUpdateManagement from "../pages/workUpdates/WorkUpdateManagement";

import Holidays from "../pages/holidays/Holidays";
import CompanyDirectory from "../pages/directory/CompanyDirectory";
import MyPayslips from "../pages/payroll/MyPayslips";
import PayrollManagement from "../pages/payroll/PayrollManagement";
import MyHelpdesk from "../pages/helpdesk/MyHelpdesk";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Profile Routes */}
          <Route
            path="/profile"
            element={<MyProfile />}
          />

          <Route
            path="/profile/password"
            element={<ChangePassword />}
          />

          {/* Attendance Routes */}
          <Route
            path="/my-attendance"
            element={<MyAttendance />}
          />

          <Route
            path="/attendance"
            element={<AttendanceList />}
          />

          <Route
            path="/attendance/:id"
            element={<AttendanceDetails />}
          />

          {/* Leave Routes */}
          <Route
            path="/my-leave"
            element={<MyLeave />}
          />

          <Route
            path="/my-leave/apply"
            element={<ApplyLeave />}
          />

          <Route
            path="/my-leave/:id"
            element={<LeaveRequestDetails />}
          />

          <Route
            path="/leave/management"
            element={<LeaveManagement />}
          />

          <Route
            path="/leave/management/:id"
            element={<LeaveRequestDetails />}
          />

          <Route
            path="/leave/types"
            element={<LeaveTypes />}
          />

          <Route
            path="/leave/types/new"
            element={<AddLeaveType />}
          />

          <Route
            path="/leave/types/:id/edit"
            element={<EditLeaveType />}
          />

          {/* Work Update Routes */}
          <Route
            path="/my-work-updates"
            element={<MyWorkUpdates />}
          />

          <Route
            path="/my-work-updates/new"
            element={<CreateWorkUpdate />}
          />

          <Route
            path="/my-work-updates/:id"
            element={<WorkUpdateDetails />}
          />

          <Route
            path="/my-work-updates/:id/edit"
            element={<EditWorkUpdate />}
          />

          <Route
            path="/work-updates/management"
            element={<WorkUpdateManagement />}
          />

          <Route
            path="/work-updates/management/:id"
            element={<WorkUpdateDetails />}
          />

          {/* Employee Routes */}
          <Route
            path="/employees"
            element={<Employees />}
          />

          <Route
            path="/employees/new"
            element={<AddEmployee />}
          />

          <Route
            path="/employees/:id/edit"
            element={<EditEmployee />}
          />

          <Route
            path="/employees/:id"
            element={<EmployeeDetails />}
          />

          {/* Department Routes */}
          <Route
            path="/departments"
            element={<Departments />}
          />

          <Route
            path="/departments/new"
            element={<AddDepartment />}
          />

          <Route
            path="/departments/:id/edit"
            element={<EditDepartment />}
          />

          <Route
            path="/departments/:id"
            element={<DepartmentDetails />}
          />

          {/* Designation Routes */}
          <Route
            path="/designations"
            element={<Designations />}
          />

          <Route
            path="/designations/new"
            element={<AddDesignation />}
          />

          <Route
            path="/designations/:id/edit"
            element={<EditDesignation />}
          />

          {/* Enterprise Self-Service (ESS) Routes */}
          <Route
            path="/holidays"
            element={<Holidays />}
          />

          <Route
            path="/directory"
            element={<CompanyDirectory />}
          />

          <Route
            path="/my-payslips"
            element={<MyPayslips />}
          />

          <Route
            path="/payroll/management"
            element={<PayrollManagement />}
          />

          <Route
            path="/helpdesk"
            element={<MyHelpdesk />}
          />
        </Route>
      </Route>

      {/* Default */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;