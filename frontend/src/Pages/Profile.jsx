
import { useCallback, useEffect, useState } from "react";
import api from "../Services/api";
import "./Profile.css";

function getErrorMessage(error) {
  if (!error.response) {
    return "Cannot connect to Django. Make sure the backend is running.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to view this profile.";
  }

  return (
    error.response.data?.detail ||
    error.response.data?.message ||
    "Unable to load your profile."
  );
}

function getInitials(user) {
  const first = user?.first_name?.trim();
  const last = user?.last_name?.trim();

  if (first || last) {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
  }

  return (user?.username || user?.email || "U").slice(0, 2).toUpperCase();
}

function getDisplayName(user) {
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  return fullName || user?.username || "FlowDesk User";
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.get("/profile/");
      const data = response.data?.user || response.data;
      setProfile(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <div className="profile-spinner" />
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="profile-page">
        <div className="profile-error-panel">
          <div className="profile-error-icon">!</div>
          <h2>Unable to load profile</h2>
          <p>{error}</p>
          <button
            type="button"
            className="profile-primary-button"
            onClick={() => loadProfile()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const user = profile || {};
  const displayName = getDisplayName(user);
  const role = String(user.role || user.user_role || "user").replaceAll("_", " ");
  const profilePicture = user.profile_picture || user.avatar || user.image;

  const joinedDate = user.date_joined
    ? new Date(user.date_joined).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="profile-page">
      <header className="profile-page-header">
        <div>
          <p className="profile-eyebrow">ACCOUNT</p>
          <h1>My Profile</h1>
          <p className="profile-subtitle">
            View your personal information and account details.
          </p>
        </div>

        <button
          type="button"
          className="profile-secondary-button"
          onClick={() => loadProfile(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="profile-inline-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="profile-success-message" role="status">
          {success}
        </div>
      )}

      <section className="profile-hero-card">
        <div className="profile-avatar">
          {profilePicture ? (
            <img src={profilePicture} alt={`${displayName}'s profile`} />
          ) : (
            <span>{getInitials(user)}</span>
          )}
        </div>

        <div className="profile-hero-info">
          <h2>{displayName}</h2>
          <p>{user.email || "No email provided"}</p>
          <span className="profile-role-badge">{role}</span>
        </div>

        <div className="profile-account-status">
          <span className="profile-status-dot" />
          <span>{user.is_active === false ? "Inactive" : "Active account"}</span>
        </div>
      </section>

      <section className="profile-details-card">
        <div className="profile-card-heading">
          <div>
            <h2>Personal information</h2>
            <p>Your account information registered with FlowDesk.</p>
          </div>
          <span className="profile-heading-icon">♙</span>
        </div>

        <div className="profile-details-grid">
          <div className="profile-detail">
            <span className="profile-detail-label">First name</span>
            <strong>{user.first_name || "Not provided"}</strong>
          </div>

          <div className="profile-detail">
            <span className="profile-detail-label">Last name</span>
            <strong>{user.last_name || "Not provided"}</strong>
          </div>

          <div className="profile-detail">
            <span className="profile-detail-label">Username</span>
            <strong>{user.username || "Not provided"}</strong>
          </div>

          <div className="profile-detail">
            <span className="profile-detail-label">Email address</span>
            <strong>{user.email || "Not provided"}</strong>
          </div>

          <div className="profile-detail">
            <span className="profile-detail-label">Phone number</span>
            <strong>{user.phone_number || "Not provided"}</strong>
          </div>

          <div className="profile-detail">
            <span className="profile-detail-label">Account role</span>
            <strong className="profile-role-text">{role}</strong>
          </div>

          {joinedDate && (
            <div className="profile-detail">
              <span className="profile-detail-label">Member since</span>
              <strong>{joinedDate}</strong>
            </div>
          )}
        </div>
      </section>

      <section className="profile-security-card">
        <div className="profile-security-icon">✓</div>
        <div>
          <h3>Account information</h3>
          <p>
            Your profile is loaded from your authenticated FlowDesk account.
            Changes should be made through supported account settings.
          </p>
        </div>
      </section>
    </main>
  );
}
