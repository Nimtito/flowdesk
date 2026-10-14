
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../Services/authservice";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const tokens = await authService.login(
        form.username.trim(),
        form.password
      );

      if (!tokens?.access || !tokens?.refresh) {
        throw new Error(
          "The server did not return the expected authentication tokens."
        );
      }

      localStorage.setItem("flowdesk_access_token", tokens.access);
      localStorage.setItem("flowdesk_refresh_token", tokens.refresh);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      localStorage.removeItem("flowdesk_access_token");
      localStorage.removeItem("flowdesk_refresh_token");

      if (err.response?.status === 401) {
        setError("Incorrect username or password. Please try again.");
      } else if (err.response?.data) {
        const data = err.response.data;

        setError(
          data.detail ||
            data.non_field_errors?.join(" ") ||
            "We couldn't sign you in. Please check your details."
        );
      } else if (err.request) {
        setError(
          "Cannot connect to FlowDesk. Make sure the Django backend is running."
        );
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page login-page">
      <aside className="register-showcase">
        <Link to="/" className="register-brand">
          <span className="register-logo">F</span>
          <span>FlowDesk</span>
        </Link>

        <div className="register-showcase-content">
          <span className="register-eyebrow">
            WELCOME BACK
          </span>

          <h1>
            Your work.
            <br />
            Your team.
            <br />
            <span>One place.</span>
          </h1>

          <p>
            Pick up where you left off. Keep your projects moving,
            your tasks organized, and your team connected.
          </p>

          <div className="register-benefits">
            <div>
              <span className="benefit-check">✓</span>
              Everything organized in one workspace
            </div>
            <div>
              <span className="benefit-check">✓</span>
              Clear priorities and project progress
            </div>
            <div>
              <span className="benefit-check">✓</span>
              A better way to work together
            </div>
          </div>
        </div>

        <div className="register-aside-footer">
          Welcome back to a clearer way of working.
        </div>
      </aside>

      <section className="register-main">
        <div className="register-card login-card">
          <Link to="/" className="register-mobile-brand">
            <span className="register-logo">F</span>
            <span>FlowDesk</span>
          </Link>

          <div className="register-heading">
            <span className="register-form-eyebrow">
              YOUR WORKSPACE IS WAITING
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in with your FlowDesk account to continue.
            </p>
          </div>

          {error && (
            <div className="register-message register-error" role="alert">
              <span className="register-message-icon">!</span>
              <div>
                <strong>Sign-in unsuccessful</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form
            className="register-form login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="register-field">
              <label htmlFor="login-username">Username</label>

              <input
                id="login-username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="login-password">Password</label>

              <div className="register-password-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="register-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <p className="register-signin">
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </p>

          <p className="register-legal">
            Your workspace, projects, and team are just a sign-in away.
          </p>
        </div>
      </section>
    </main>
  );
}
