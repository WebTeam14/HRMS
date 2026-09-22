import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Users,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  type Employee,
  getEmployees,
  deleteEmployee,
} from "../../services/employeeService";
import { EditEmployeeModal } from "../../components/employees/EditEmployeeModal";

const Employees = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canDelete =
    user?.role === "CEO" ||
    user?.role === "ADMIN" ||
    user?.role === "HR";

  const [selectedEditId, setSelectedEditId] = useState<string | null>(null);

  const handleDeleteEmployee = async (employee: Employee) => {
    const fullName = `${employee.firstName} ${employee.lastName || ""}`.trim();
    const confirmed = window.confirm(
      `Are you sure you want to delete employee "${fullName}" (${employee.employeeCode})?\n\nThis will permanently remove their employee record and user account.`
    );

    if (!confirmed) return;

    try {
      await deleteEmployee(employee._id);
      await loadEmployees();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to delete employee."
      );
    }
  };

  const [
    employees,
    setEmployees,
  ] = useState<Employee[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    employmentType,
    setEmploymentType,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const loadEmployees =
    async () => {
      try {
        setLoading(true);

        const result =
          await getEmployees({
            search: search || undefined,
            status: status || undefined,
            employmentType:
              employmentType || undefined,
            page,
            limit: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
          });

        setEmployees(
          result.data
        );

        setTotal(
          result.meta.total
        );

        setTotalPages(
          result.meta.totalPages
        );
      } catch (error) {
        console.error(
          "Failed to load employees:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadEmployees();
  }, [
    search,
    status,
    employmentType,
    page,
  ]);

  const getFullName = (
    employee: Employee
  ) => {
    return `${employee.firstName} ${
      employee.lastName || ""
    }`.trim();
  };

  const getStatusClass = (
    value: Employee["status"]
  ) => {
    switch (value) {
      case "ACTIVE":
        return "status-badge status-active";

      case "ON_LEAVE":
        return "status-badge status-leave";

      case "NOTICE_PERIOD":
        return "status-badge status-notice";

      default:
        return "status-badge status-inactive";
    }
  };

  return (
    <div className="employees-page">

      {/* Header */}
      <div className="page-header">

        <div>
          <h1>
            Employees
          </h1>

          <p>
            Manage your organization's
            employee records.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate(
              "/employees/new"
            )
          }
        >
          <Plus size={17} />
          Add Employee
        </button>

      </div>

      {/* Summary */}
      <div className="employee-summary">

        <div className="summary-icon">
          <Users size={20} />
        </div>

        <div>
          <span>
            Total Employees
          </span>

          <strong>
            {total}
          </strong>
        </div>

      </div>

      {/* Filters */}
      <div className="employee-toolbar">

        <div className="search-box">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(
                event.target.value
              );
            }}
          />

        </div>

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(
              event.target.value
            );
          }}
        >
          <option value="">
            All Status
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="ON_LEAVE">
            On Leave
          </option>

          <option value="NOTICE_PERIOD">
            Notice Period
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>

        <select
          value={employmentType}
          onChange={(event) => {
            setPage(1);
            setEmploymentType(
              event.target.value
            );
          }}
        >
          <option value="">
            All Employment Types
          </option>

          <option value="FULL_TIME">
            Full Time
          </option>

          <option value="PART_TIME">
            Part Time
          </option>

          <option value="CONTRACT">
            Contract
          </option>

          <option value="INTERN">
            Intern
          </option>
        </select>

      </div>

      {/* Table */}
      <div className="employee-table-card">

        <div className="table-wrapper">

          <table>

            <thead>
              <tr>
                <th>
                  Employee
                </th>

                <th>
                  Department
                </th>

                <th>
                  Designation
                </th>

                <th>
                  Employment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="table-empty"
                  >
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="table-empty"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map(
                  (employee) => (
                    <tr
                      key={
                        employee._id
                      }
                    >

                      <td>

                        <div className="employee-cell">

                          <div className="employee-avatar">
                            {employee.firstName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {getFullName(
                                employee
                              )}
                            </strong>

                            <span>
                              {
                                employee.employeeCode
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        {
                          employee
                            .departmentId
                            ?.name || "—"
                        }
                      </td>

                      <td>
                        {
                          employee.designation ||
                          "—"
                        }
                      </td>

                      <td>
                        {employee.employmentType
                          .replace(
                            "_",
                            " "
                          )}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            employee.status
                          )}
                        >
                          {employee.status
                            .replace(
                              "_",
                              " "
                            )}
                        </span>
                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            type="button"
                            title="View employee"
                            onClick={() =>
                              navigate(
                                `/employees/${employee._id}`
                              )
                            }
                          >
                            <Eye
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            title="Edit employee"
                            onClick={() => setSelectedEditId(employee._id)}
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              title="Delete employee"
                              className="danger-icon-btn"
                              style={{ color: "#ef4444" }}
                              onClick={() => handleDeleteEmployee(employee)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            title="More actions"
                          >
                            <MoreHorizontal
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}
        <div className="table-footer">

          <span>
            Showing{" "}
            {employees.length} of{" "}
            {total} employees
          </span>

          <div className="pagination">

            <button
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (current) =>
                    current - 1
                )
              }
            >
              Previous
            </button>

            <span>
              Page {page} of{" "}
              {totalPages}
            </span>

            <button
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1
                )
              }
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* Edit Employee Pop-up Modal */}
      <EditEmployeeModal
        employeeId={selectedEditId}
        isOpen={Boolean(selectedEditId)}
        onClose={() => setSelectedEditId(null)}
        onSuccess={() => {
          setSelectedEditId(null);
          loadEmployees();
        }}
      />
    </div>
  );
};

export default Employees;