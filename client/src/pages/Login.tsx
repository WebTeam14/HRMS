import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Building2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

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
      <div
        className="loading-screen"
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          color: "#fff",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "16px",
              boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
              animation: "pulse 2s infinite",
            }}
          >
            T
          </div>
          <h3 style={{ margin: 0, fontWeight: 700 }}>Technoriya HRMS</h3>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "14px" }}>
            Loading workspace environment...
          </p>
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
      setError(
        err?.response?.data?.message ||
          "Invalid credentials. Please verify your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-ambient-orb orb-1"></div>
      <div className="login-ambient-orb orb-2"></div>
      <div className="login-ambient-orb orb-3"></div>

      <div className="login-card-wrapper">
        {/* Top Header Branding */}
        <div className="login-header">
          <div className="brand-logo-container">
            <div className="brand-mark-glow">
              <Building2 size={24} color="#ffffff" />
            </div>
            <div>
              <h1 className="brand-title">Technoriya</h1>
              <p className="brand-subtitle">eTechnologies Pvt Ltd – HRMS Portal</p>
            </div>
          </div>
          <div className="enterprise-badge">
            <Sparkles size={13} color="#818cf8" />
            <span>Enterprise Suite</span>
          </div>
        </div>

        <div className="login-content">
          <div className="login-heading">
            <h2>Welcome Back</h2>
            <p>Sign in with your corporate employee credentials</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={15} style={{ color: "#6366f1" }} />
                Email or Employee ID
              </label>
              <div className="input-with-icon">
                <input
                  id="email"
                  type="text"
                  placeholder="e.g. name@technoriya.com or EMP1001"
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
                  <Lock size={15} style={{ color: "#6366f1" }} />
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
                  Sign In to HRMS <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-security-notice">
            <CheckCircle2 size={15} color="#10b981" />
            <span>Authorized access only. Logins are monitored for security compliance.</span>
          </div>
        </div>

        <div className="login-footer">
          <ShieldCheck size={14} color="#10b981" />
          <span>256-Bit SSL Encrypted · Technoriya eTechnologies Pvt Ltd</span>
        </div>
      </div>
    </div>
  );
};

export default Login;