import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getRoleDefaultRoute } from "../../utils/roleRoutes";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // If already logged in redirect to role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRoleDefaultRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) clearError();
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email || !password) return;

    try {
      const userData = await login(email, password);
      navigate(getRoleDefaultRoute(userData.role), { replace: true });
    } catch {
      // error is set in the store by useAuth
    }
  };

  const roleBadges = [
    { label: "Admin", color: "#e74c3c" },
    { label: "Recruiter", color: "#e67e22" },
    { label: "Vendor", color: "#27ae60" },
    { label: "Client", color: "#2980b9" },
  ];

  return (
    <div style={styles.root}>
      {/* Background grid pattern */}
      <div style={styles.gridOverlay} />

      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.brandBlock}>
          <div style={styles.logoMark}>
            <span style={styles.logoS}>S</span>
          </div>
          <h1 style={styles.brandName}>Shivaay</h1>
          <p style={styles.brandTagline}>HR & Recruitment Platform</p>
        </div>

        <div style={styles.featureList}>
          {[
            { icon: "⚡", text: "AI-powered CV matching engine" },
            { icon: "🔒", text: "Role-based secure access" },
            { icon: "📊", text: "End-to-end pipeline tracking" },
            { icon: "🤝", text: "Client & vendor portals" },
          ].map((f, i) => (
            <div key={i} style={styles.featureItem}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={styles.roleRow}>
          {roleBadges.map((r) => (
            <span
              key={r.label}
              style={{ ...styles.roleBadge, borderColor: r.color, color: r.color }}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSubtitle}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <span style={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Email field */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>✉</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="you@shivaay.com"
                  style={{
                    ...styles.input,
                    borderColor:
                      touched.email && !email ? "#e74c3c" : "#2a2a2a",
                  }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {touched.email && !email && (
                <span style={styles.fieldError}>Email is required</span>
              )}
            </div>

            {/* Password field */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔑</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  style={{
                    ...styles.input,
                    borderColor:
                      touched.password && !password ? "#e74c3c" : "#2a2a2a",
                    paddingRight: "48px",
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {touched.password && !password && (
                <span style={styles.fieldError}>Password is required</span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.submitBtn,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? (
                <span style={styles.spinnerRow}>
                  <span style={styles.spinner} />
                  Signing in...
                </span>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <div style={styles.cardFooter}>
            <p style={styles.footerText}>
              Access is managed by your administrator.
              <br />
              Contact{" "}
              <a href="mailto:admin@shivaay.com" style={styles.footerLink}>
                admin@shivaay.com
              </a>{" "}
              for access.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-card {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
    fontFamily: "'Syne', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  leftPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 64px",
    position: "relative",
    zIndex: 1,
    borderRight: "1px solid #1a1a1a",
  },
  brandBlock: {
    marginBottom: "56px",
  },
  logoMark: {
    width: "56px",
    height: "56px",
    backgroundColor: "#e74c3c",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    transform: "rotate(-3deg)",
  },
  logoS: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "800",
    lineHeight: 1,
  },
  brandName: {
    color: "#ffffff",
    fontSize: "42px",
    fontWeight: "800",
    letterSpacing: "-1px",
    lineHeight: 1,
    marginBottom: "8px",
  },
  brandTagline: {
    color: "#666",
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.5px",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "48px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  featureIcon: {
    fontSize: "20px",
    width: "36px",
    height: "36px",
    backgroundColor: "#141414",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid #1f1f1f",
  },
  featureText: {
    color: "#aaa",
    fontSize: "15px",
    fontWeight: "400",
  },
  roleRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  roleBadge: {
    padding: "4px 12px",
    borderRadius: "999px",
    border: "1px solid",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.5px",
    fontWeight: "500",
  },
  rightPanel: {
    width: "480px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 48px",
    position: "relative",
    zIndex: 1,
  },
  card: {
    width: "100%",
    animation: "fadeIn 0.4s ease forwards",
  },
  cardHeader: {
    marginBottom: "32px",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    marginBottom: "6px",
  },
  cardSubtitle: {
    color: "#555",
    fontSize: "14px",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    border: "1px solid rgba(231, 76, 60, 0.3)",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "24px",
    color: "#e74c3c",
    fontSize: "14px",
  },
  errorIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#888",
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "14px",
    pointerEvents: "none",
    zIndex: 1,
  },
  input: {
    width: "100%",
    backgroundColor: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "13px 14px 13px 40px",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none",
    transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    lineHeight: 1,
  },
  fieldError: {
    color: "#e74c3c",
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  submitBtn: {
    marginTop: "8px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "0.3px",
    transition: "background-color 0.2s, transform 0.1s",
    width: "100%",
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  cardFooter: {
    marginTop: "28px",
    paddingTop: "24px",
    borderTop: "1px solid #1a1a1a",
  },
  footerText: {
    color: "#444",
    fontSize: "13px",
    lineHeight: "1.6",
    textAlign: "center",
  },
  footerLink: {
    color: "#666",
    textDecoration: "none",
  },
};