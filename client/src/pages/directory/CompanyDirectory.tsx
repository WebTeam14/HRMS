import { useEffect, useState } from "react";
import {
  Search,
  Building2,
  Mail,
  Phone,
  UserCheck,
  Briefcase,
  Users,
} from "lucide-react";
import api from "../../services/api";
import { getDepartments, type Department } from "../../services/departmentService";

interface DirectoryEmployee {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName?: string;
  designation?: string;
  phone?: string;
  workLocation?: string;
  employmentType?: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  managerId?: {
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName?: string;
    designation?: string;
  };
  userId?: {
    _id: string;
    email: string;
    role: string;
  };
}

const CompanyDirectory = () => {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  const loadDirectory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedDept) params.append("departmentId", selectedDept);

      const res = await api.get<{ success: boolean; data: DirectoryEmployee[] }>(
        `/employees/directory?${params.toString()}`
      );
      setEmployees(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load company directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDepartments().then((res) => setDepartments(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDirectory();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedDept]);

  return (
    <div className="directory-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Company Directory</h1>
          <p>Search and connect with team members across the organization</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px", fontWeight: 600 }}>
          <Users size={18} /> {employees.length} Team Members
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className="details-card"
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "260px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "8px 14px",
          }}
        >
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search by name, designation, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              width: "100%",
              fontSize: "13px",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Building2 size={16} color="#64748b" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              fontSize: "13px",
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="details-card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          Loading company directory...
        </div>
      ) : error ? (
        <div className="details-card" style={{ padding: "30px", color: "#dc2626", background: "#fef2f2" }}>
          {error}
        </div>
      ) : employees.length === 0 ? (
        <div className="details-card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          No team members found matching your search.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {employees.map((emp) => {
            const fullName = `${emp.firstName} ${emp.lastName || ""}`.trim();
            const initial = emp.firstName.charAt(0).toUpperCase();

            return (
              <div
                key={emp._id}
                style={{
                  background: "white",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  {/* Top Row: Avatar & Code */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "12px",
                        background: "#172033",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: 700,
                      }}
                    >
                      {initial}
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        color: "#475569",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {emp.employeeCode}
                    </span>
                  </div>

                  {/* Name & Designation */}
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#0f172a" }}>{fullName}</h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#475569",
                      fontWeight: 500,
                      marginBottom: "12px",
                    }}
                  >
                    <Briefcase size={14} color="#64748b" /> {emp.designation || "Associate"}
                  </div>

                  {/* Department Badge */}
                  {emp.departmentId && (
                    <div style={{ marginBottom: "16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: "#eff6ff",
                          color: "#2563eb",
                        }}
                      >
                        {emp.departmentId.name}
                      </span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                    {emp.userId?.email && (
                      <a
                        href={`mailto:${emp.userId.email}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#334155",
                          textDecoration: "none",
                        }}
                      >
                        <Mail size={14} color="#64748b" />
                        <span>{emp.userId.email}</span>
                      </a>
                    )}

                    {emp.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Phone size={14} color="#64748b" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Manager */}
                {emp.managerId && (
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    <UserCheck size={13} color="#059669" />
                    <span>
                      Reports to: <strong>{emp.managerId.firstName} {emp.managerId.lastName || ""}</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyDirectory;
