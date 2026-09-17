import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { changePassword } from "../../services/profileService";

const ChangePassword = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setLoading(true);
      const res = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess(res.message || "Password updated successfully!");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error("Failed to change password:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to change password. Please verify your current password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-form-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft size={16} />
            Back to Profile
          </button>

          <h1>Change Password</h1>
          <p>Update your account login password for enhanced security.</p>
        </div>
      </div>

      {/* Alerts */}
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
            marginBottom: "18px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#059669" }} />
          {success}
        </div>
      )}

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
            marginBottom: "18px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} style={{ color: "#dc2626" }} />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="employee-form"
        style={{ maxWidth: "600px" }}
      >
        <section className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <KeyRound size={18} />
            </div>
            <div>
              <h2>Password Credentials</h2>
              <p>Enter your existing password and choose a strong new password.</p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* Current Password */}
            <div className="form-field">
              <label>
                Current Password <span className="required">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={form.currentPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-field">
              <label>
                New Password <span className="required">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.newPassword}
                  onChange={handleChange}
                  minLength={8}
                  required
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small>Must be at least 8 characters long.</small>
            </div>

            {/* Confirm New Password */}
            <div className="form-field">
              <label>
                Confirm New Password <span className="required">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  minLength={8}
                  required
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
            <span>
              Your new password is encrypted using high-security bcrypt hash algorithms before saving.
            </span>
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/profile")}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
