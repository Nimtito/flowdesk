import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../Context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "employee",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      formData.password !==
      formData.confirm_password
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    if (
      formData.password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const {
        confirm_password,
        ...userData
      } = formData;

      await register(userData);

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      const responseData =
        error.response?.data;

      if (
        responseData &&
        typeof responseData ===
          "object"
      ) {
        const messages =
          Object.entries(
            responseData
          )
            .map(
              ([field, message]) => {
                const formatted =
                  Array.isArray(message)
                    ? message.join(" ")
                    : message;

                return `${field}: ${formatted}`;
              }
            )
            .join(" ");

        setError(
          messages ||
            "Registration failed."
        );
      } else {
        setError(
          "Unable to create your account."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">

        <div className="auth-brand">
          <h1>FlowDesk</h1>
          <p>
            Developer Project Management Platform
          </p>
        </div>

        <div className="auth-heading">
          <h2>Create your account</h2>
          <p>
            Start managing your development workflow.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="first_name">
                First name
              </label>

              <input
                id="first_name"
                name="first_name"
                value={
                  formData.first_name
                }
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Last name
              </label>

              <input
                id="last_name"
                name="last_name"
                value={
                  formData.last_name
                }
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

          </div>

          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              name="username"
              value={
                formData.username
              }
              onChange={handleChange}
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">
              Phone number
            </label>

            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={
                formData.phone_number
              }
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              Role
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="employee">
                Employee
              </option>

              <option value="manager">
                Manager
              </option>
            </select>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={
                  formData.password
                }
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">
                Confirm password
              </label>

              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={
                  formData.confirm_password
                }
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>

          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create account"}
          </button>

        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}