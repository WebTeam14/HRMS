import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";

const Login = () => {
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="login-loading-screen">
        <div className="login-loading-card">
          <img src="/logo.png" alt="Technoriya Logo" className="login-loading-logo" />
          <h3>Technoriya HRMS</h3>
          <p>Loading workspace environment...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login({ emailOrEmployeeId: email, password });
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (
        err?.code === "ERR_NETWORK" ||
        err?.message === "Network Error" ||
        !err?.response
      ) {
        setError(
          "Unable to reach backend server. If using Render, the backend server may take ~30 seconds to wake up from cold start. Please wait a moment and click Sign In again."
        );
      } else {
        setError(
          "Invalid email/employee ID or password. Please verify your credentials and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-container">
        <div className="login-card">
          {/* Top Brand Header */}
          <div className="login-header-section">
            <div className="login-logo-wrapper">
              <img
                src="/logo.png"
                alt="Technoriya eTechnologies Logo"
                className="login-brand-logo"
              />
            </div>
            <h1 className="login-brand-title">Technoriya eTechnologies</h1>
            <p className="login-brand-subtitle">Human Resource Management System</p>
          </div>

          <div className="login-body-section">
            <div className="login-intro">
              <h2>Employee Sign In</h2>
              <p>Enter your corporate credentials to access the portal</p>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span>⚠️</span>
                <div>{error}</div>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={15} style={{ color: "#475569" }} />
                  Email or Employee ID
                </label>
                <div className="input-with-icon">
                  <input
                    id="email"
                    type="text"
                    placeholder="e.g. name@technoriya.in or EMP1001"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">
                    <Lock size={15} style={{ color: "#475569" }} />
                    Password
                  </label>
                </div>
                <div className="input-with-icon password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color="#64748b" />
                    ) : (
                      <Eye size={16} color="#64748b" />
                    )}
                  </button>
                </div>
              </div>

              <div className="login-form-options">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                className="primary-button login-button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span> Signing in...
                  </>
                ) : (
                  <>
                    Sign In to HRMS <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="login-footer-section">
            <div className="login-security-tag">
              <ShieldCheck size={14} color="#059669" />
              <span>Authorized personnel only • 256-Bit SSL Encrypted</span>
            </div>
            <div className="login-address-text">
              B - 118, Balaji Bhawan, Sector 11, CBD Belapur, 400614
            </div>
          </div>
        </div>

        <div className="login-copyright">
          © {new Date().getFullYear()} Technoriya eTechnologies Pvt. Ltd. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;