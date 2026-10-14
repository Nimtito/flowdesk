
import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../Services/authservice";
import "./Auth.css";

const initialForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone_number: "",
  role: "employee",
  password: "",
  confirm_password: "",
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (form.password !== form.confirm_password) {
      setError("Your passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        role: form.role,
        password: form.password,
      };

      await authService.register(userData);

      setSuccess(
        "Your account has been created successfully! You can now sign in."
      );

      setForm(initialForm);
    } catch (err) {
      const responseData = err.response?.data;

      if (responseData && typeof responseData === "object") {
        const messages = Object.entries(responseData).map(
          ([field, value]) => {
            const readableField =
              field === "non_field_errors"
                ? "Registration"
                : field.replaceAll("_", " ");

            const readableMessage = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${readableField}: ${readableMessage}`;
          }
        );

        setError(messages.join(" "));
      } else if (err.request) {
        setError(
          "Cannot connect to FlowDesk. Please make sure the Django backend is running."
        );
      } else {
        setError(
          err.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <aside className="register-showcase">
        <Link to="/" className="register-brand">
          <span className="register-logo">F</span>
          <span>FlowDesk</span>
        </Link>

        <div className="register-showcase-content">
          <span className="register-eyebrow">
            WORK BETTER. TOGETHER.
          </span>

          <h1>
            Turn your team's
            <br />
            plans into
            <br />
            <span>progress.</span>
          </h1>

          <p>
            Your projects, tasks, and collaboration in one organized
            workspace. Get clarity on your work and focus on what matters.
          </p>

          <div className="register-benefits">
            <div>
              <span className="benefit-check">✓</span>
              Organize projects in one place
            </div>
            <div>
              <span className="benefit-check">✓</span>
              Keep track of tasks and deadlines
            </div>
            <div>
              <span className="benefit-check">✓</span>
              Work towards shared goals
            </div>
          </div>
        </div>

        <div className="register-aside-footer">
          A clearer way to move work forward.
        </div>
      </aside>

      <section className="register-main">
        <div className="register-card">
          <Link to="/" className="register-mobile-brand">
            <span className="register-logo">F</span>
            <span>FlowDesk</span>
          </Link>

          <div className="register-heading">
            <span className="register-form-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </span>
            <h2>Create your account</h2>
            <p>
              Join FlowDesk and bring your work together.
            </p>
          </div>

          {error && (
            <div className="register-message register-error" role="alert">
              <span className="register-message-icon">!</span>
              <div>
                <strong>We couldn't create your account.</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div
              className="register-message register-success"
              role="status"
            >
              <span className="register-message-icon">✓</span>
              <div>
                <strong>You're all set!</strong>
                <p>{success}</p>
                <Link to="/login" className="register-success-link">
                  Continue to sign in →
                </Link>
              </div>
            </div>
          )}

          <form
            className="register-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="register-name-row">
              <div className="register-field">
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                autoComplete="username"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="phone_number">
                Phone number <span className="register-optional">Optional</span>
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="Enter your phone number"
                autoComplete="tel"
              />
            </div>

            <div className="register-field">
              <label htmlFor="role">Account role</label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="employee">Employee</option>
              </select>
              <span className="register-hint">
                Other roles can be assigned by an administrator.
              </span>
            </div>

            <div className="register-field">
              <label htmlFor="password">Password</label>
              <div className="register-password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
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

            <div className="register-field">
              <label htmlFor="confirm_password">Confirm password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? "text" : "password"}
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={loading || Boolean(success)}
            >
              {loading ? (
                <>
                  <span className="register-spinner" />
                  Creating account...
                </>
              ) : success ? (
                "Account created ✓"
              ) : (
                <>
                  Create account <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <p className="register-signin">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

          <p className="register-legal">
            By creating an account, you agree to use FlowDesk responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}
