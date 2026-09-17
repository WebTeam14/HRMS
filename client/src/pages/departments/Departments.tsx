import {
  Search,
  Plus,
  Eye,
  Pencil,
  Power,
  Building2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Department,
  getDepartments,
  updateDepartmentStatus,
} from "../../services/departmentService";

const Departments = () => {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const result = await getDepartments({
        search: search || undefined,
        status: status || undefined,
        page,
        limit: 10,
        sortBy: "name",
        sortOrder: "asc",
      });

      setDepartments(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      console.error("Failed to load departments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [search, status, page]);

  const handleToggleStatus = async (dept: Department) => {
    const nextStatus = !dept.isActive;
    const confirmText = nextStatus
      ? `Are you sure you want to activate department "${dept.name}"?`
      : `Are you sure you want to deactivate department "${dept.name}"?`;

    if (!window.confirm(confirmText)) return;

    try {
      setActionLoading(dept._id);
      await updateDepartmentStatus(dept._id, nextStatus);
      await loadDepartments();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to update department status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="employees-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Departments</h1>
          <p>Manage organizational departments and department heads.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/departments/new")}
        >
          <Plus size={17} />
          Add Department
        </button>
      </div>

      {/* Summary */}
      <div className="employee-summary">
        <div className="summary-icon">
          <Building2 size={20} />
        </div>
        <div>
          <span>Total Departments</span>
          <strong>{total}</strong>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="employee-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search by department name or code..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="employee-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Manager / Lead</th>
                <th>Employees</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: "20px" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Loading departments...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No departments found.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept._id}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <strong>{dept.name}</strong>
                          <span>
                            {dept.description || "No description"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          color: "#1e293b",
                        }}
                      >
                        {dept.code}
                      </span>
                    </td>

                    <td>
                      {dept.managerId ? (
                        <div>
                          <strong style={{ fontSize: "12px", color: "#1e293b" }}>
                            {dept.managerId.firstName}{" "}
                            {dept.managerId.lastName || ""}
                          </strong>
                          <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {dept.managerId.designation ||
                              dept.managerId.employeeCode}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 600,
                        }}
                      >
                        <Users size={13} style={{ color: "#94a3b8" }} />
                        {dept.employeeCount ?? 0}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          dept.isActive ? "status-active" : "status-inactive"
                        }`}
                      >
                        {dept.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div
                        className="table-actions"
                        style={{ justifyContent: "flex-end" }}
                      >
                        <button
                          title="View Details"
                          onClick={() =>
                            navigate(`/departments/${dept._id}`)
                          }
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          title="Edit Department"
                          onClick={() =>
                            navigate(`/departments/${dept._id}/edit`)
                          }
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          title={
                            dept.isActive
                              ? "Deactivate Department"
                              : "Activate Department"
                          }
                          disabled={actionLoading === dept._id}
                          onClick={() => handleToggleStatus(dept)}
                          style={{
                            color: dept.isActive ? "#dc2626" : "#16a34a",
                          }}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="table-footer">
          <div>
            Showing {departments.length} of {total} departments
          </div>

          <div className="pagination">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages || 1}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departments;
