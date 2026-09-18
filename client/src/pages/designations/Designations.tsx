import {
  Search,
  Plus,
  Pencil,
  Power,
  Briefcase,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Designation,
  getDesignations,
  updateDesignationStatus,
} from "../../services/designationService";
import {
  getDepartments,
  type Department,
} from "../../services/departmentService";

const Designations = () => {
  const navigate = useNavigate();

  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFilterDepartments = async () => {
    try {
      const res = await getDepartments({ limit: 100 });
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments filter list:", err);
    }
  };

  const loadDesignations = async () => {
    try {
      setLoading(true);
      const result = await getDesignations({
        search: search || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
        page,
        limit: 10,
        sortBy: "name",
        sortOrder: "asc",
      });

      setDesignations(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      console.error("Failed to load designations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterDepartments();
  }, []);

  useEffect(() => {
    loadDesignations();
  }, [search, departmentId, status, page]);

  const handleToggleStatus = async (designation: Designation) => {
    const nextStatus = !designation.isActive;
    const confirmText = nextStatus
      ? `Are you sure you want to activate designation "${designation.name}"?`
      : `Are you sure you want to deactivate designation "${designation.name}"?`;

    if (!window.confirm(confirmText)) return;

    try {
      setActionLoading(designation._id);
      await updateDesignationStatus(designation._id, nextStatus);
      await loadDesignations();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to update designation status."
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
          <h1>Designations</h1>
          <p>Define job roles and designations structured by department.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/designations/new")}
        >
          <Plus size={17} />
          Add Designation
        </button>
      </div>

      {/* Summary */}
      <div className="employee-summary">
        <div className="summary-icon">
          <Briefcase size={20} />
        </div>
        <div>
          <span>Total Designations</span>
          <strong>{total}</strong>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="employee-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search by designation name or code..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        <select
          value={departmentId}
          onChange={(e) => {
            setPage(1);
            setDepartmentId(e.target.value);
          }}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>

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
                <th>Designation</th>
                <th>Code</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: "20px" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Loading designations...
                  </td>
                </tr>
              ) : designations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No designations found.
                  </td>
                </tr>
              ) : (
                designations.map((desig) => (
                  <tr key={desig._id}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          <Briefcase size={16} />
                        </div>
                        <div>
                          <strong>{desig.name}</strong>
                          <span>
                            {desig.description || "No description"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          color: desig.code ? "#1e293b" : "#94a3b8",
                        }}
                      >
                        {desig.code || "—"}
                      </span>
                    </td>

                    <td>
                      {desig.departmentId ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          <Building2 size={14} style={{ color: "#94a3b8" }} />
                          {desig.departmentId.name} ({desig.departmentId.code})
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>
                          All Departments / General
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          desig.isActive
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {desig.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div
                        className="table-actions"
                        style={{ justifyContent: "flex-end" }}
                      >
                        <button
                          title="Edit Designation"
                          onClick={() =>
                            navigate(`/designations/${desig._id}/edit`)
                          }
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          title={
                            desig.isActive
                              ? "Deactivate Designation"
                              : "Activate Designation"
                          }
                          disabled={actionLoading === desig._id}
                          onClick={() => handleToggleStatus(desig)}
                          style={{
                            color: desig.isActive ? "#dc2626" : "#16a34a",
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
            Showing {designations.length} of {total} designations
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

export default Designations;
