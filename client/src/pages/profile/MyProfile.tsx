import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  KeyRound,
  Edit,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  getMyProfile,
  updateMyProfile,
} from "../../services/profileService";
import type { Employee } from "../../types";

const MyProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getMyProfile();
      setProfile(res.data);

      setEditForm({
        firstName: res.data.firstName || "",
        lastName: res.data.lastName || "",
        phone: res.data.phone || "",
        dateOfBirth: res.data.dateOfBirth
          ? res.data.dateOfBirth.substring(0, 10)
          : "",
        gender: res.data.gender || "",
      });
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load profile information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEditToggle = () => {
    if (isEditing && profile) {
      // Reset to current profile data
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth
          ? profile.dateOfBirth.substring(0, 10)
          : "",
        gender: profile.gender || "",
      });
    }
    setError("");
    setSuccess("");
    setIsEditing(!isEditing);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editForm.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await updateMyProfile({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
        gender:
          (editForm.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
      });

      setProfile(res.data);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-details-page">
        <div className="page-loading">Loading your profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="employee-details-page">
        <div className="error-card">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const fullName = `${profile.firstName} ${
    profile.lastName || ""
  }`.trim();

  const initials = `${profile.firstName?.[0] || ""}${
    profile.lastName?.[0] || ""
  }`.toUpperCase();

  const deptName =
    typeof profile.departmentId === "object" && profile.departmentId
      ? profile.departmentId.name
      : undefined;

  const deptCode =
    typeof profile.departmentId === "object" && profile.departmentId
      ? profile.departmentId.code
      : undefined;

  const managerFullName =
    typeof profile.managerId === "object" && profile.managerId
      ? `${profile.managerId.firstName} ${
          profile.managerId.lastName || ""
        }`.trim()
      : undefined;

  const managerDesignation =
    typeof profile.managerId === "object" && profile.managerId
      ? profile.managerId.designation
      : undefined;

  const userAccount =
    typeof profile.userId === "object" && profile.userId
      ? profile.userId
      : undefined;

  return (
    <div className="employee-details-page">
      {/* Topbar navigation & actions */}
      <div className="details-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: "22px" }}>My Profile</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
            View and manage your employee credentials and personal details.
          </p>
        </div>

        <div className="details-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={() => navigate("/profile/password")}
          >
            <KeyRound size={16} />
            Change Password
          </button>

          <button
            type="button"
            className={isEditing ? "secondary-action" : "primary-button"}
            onClick={handleEditToggle}
          >
            {isEditing ? (
              <>
                <X size={16} />
                Cancel Edit
              </>
            ) : (
              <>
                <Edit size={16} />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success alert */}
      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "12px 16px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#059669" }} />
          {success}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} style={{ color: "#dc2626" }} />
          {error}
        </div>
      )}

      {/* Header Profile Card */}
      <div className="employee-profile-card">
        <div className="employee-avatar-large">{initials}</div>

        <div className="employee-profile-info">
          <div className="profile-name-row">
            <h1>{fullName}</h1>
            <span
              className={`status-badge status-${profile.status.toLowerCase()}`}
            >
              {profile.status.replace("_", " ")}
            </span>
          </div>

          <p className="employee-designation">
            {profile.designation || "No Designation"}
            {deptName && ` • ${deptName} (${deptCode})`}
          </p>

          <div className="profile-meta">
            <span>
              <UserRound size={15} />
              {profile.employeeCode}
            </span>

            <span>
              <Mail size={15} />
              {userAccount?.email || "No email"}
            </span>

            {profile.phone && (
              <span>
                <Phone size={15} />
                {profile.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="details-grid">
        {/* Personal Information (Editable) */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <UserRound size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <h2>Personal Information</h2>
              <p>Your contact and identification details</p>
            </div>
            {isEditing && (
              <span
                style={{
                  fontSize: "11px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                Editing Mode
              </span>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <div className="form-grid" style={{ gap: "14px" }}>
                <div className="form-field">
                  <label>
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Last Name</label>
                  <input
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={editForm.phone}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={editForm.gender}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                  paddingTop: "14px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleEditToggle}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="info-grid">
              <InfoItem label="First Name" value={profile.firstName} />
              <InfoItem label="Last Name" value={profile.lastName} />
              <InfoItem label="Phone" value={profile.phone} />
              <InfoItem
                label="Date of Birth"
                value={
                  profile.dateOfBirth
                    ? formatDate(profile.dateOfBirth)
                    : undefined
                }
              />
              <InfoItem label="Gender" value={profile.gender} />
            </div>
          )}
        </section>

        {/* Job Information (Read-only) */}
        <section className="details-card">
          <div className="details-card-header">
            <div className="details-icon">
              <Briefcase size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <h2>Job Information</h2>
              <p>Official employment details (Managed by HR)</p>
            </div>
          </div>

          <div className="info-grid">
            <InfoItem
              label="Employee Code"
              value={profile.employeeCode}
            />

            <InfoItem
              label="Designation"
              value={profile.designation}
            />

            <InfoItem
              label="Department"
              value={
                deptName && deptCode
                  ? `${deptName} (${deptCode})`
                  : deptName
              }
            />

            <InfoItem
              label="Reporting Manager"
              value={
                managerFullName
                  ? `${managerFullName}${
                      managerDesignation
                        ? ` — ${managerDesignation}`
                        : ""
                    }`
                  : undefined
              }
            />

            <InfoItem
              label="Joining Date"
              value={formatDate(profile.joiningDate)}
            />

            <InfoItem
              label="Employment Type"
              value={formatEmploymentType(profile.employmentType)}
            />

            <InfoItem
              label="Work Location"
              value={profile.workLocation}
            />
          </div>
        </section>

        {/* Account Information (Read-only) */}
        <section className="details-card" style={{ gridColumn: "1 / -1" }}>
          <div className="details-card-header">
            <div className="details-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2>Account Information</h2>
              <p>System credentials and account status</p>
            </div>
          </div>

          <div className="info-grid">
            <InfoItem
              label="Account Email"
              value={userAccount?.email}
            />

            <InfoItem
              label="System Role"
              value={userAccount?.role}
            />

            <InfoItem
              label="Account Status"
              value={
                userAccount?.isActive ? "Active Account" : "Suspended"
              }
            />

            <InfoItem
              label="Member Since"
              value={formatDate(profile.createdAt)}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

interface InfoItemProps {
  label: string;
  value?: string;
}

const InfoItem = ({ label, value }: InfoItemProps) => {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
};

const formatDate = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatEmploymentType = (type?: string) => {
  if (!type) return "—";
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default MyProfile;
