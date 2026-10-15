
import { useEffect, useState } from "react";
import api from "../Services/api";
import "./Settings.css";

const DEFAULT_SETTINGS = {
  compactView: false,
  showTaskReminders: true,
  showProjectUpdates: true,
  showEmailAlerts: false,
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedMessage, setSavedMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get("/profile/")
      .then((response) => {
        if (active) {
          setProfile(response.data?.user || response.data);
        }
      })
      .catch(() => {
        if (active) {
          setProfileError("Account information could not be loaded.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSavedMessage("");
  }

  function savePreferences() {
    // Preferences are kept locally in this browser.
    try {
      localStorage.setItem("flowdesk_preferences", JSON.stringify(settings));
      setSavedMessage("Your preferences have been saved in this browser.");
    } catch {
      setSavedMessage("Preferences could not be saved in this browser.");
    }
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem("flowdesk_preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Keep default settings if saved preferences cannot be read.
    }
  }, []);

  function resetPreferences() {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(
        "flowdesk_preferences",
        JSON.stringify(DEFAULT_SETTINGS)
      );
      setSavedMessage("Preferences have been reset.");
    } catch {
      setSavedMessage("Preferences reset for this session only.");
    }
  }

  function logout() {
    setLoggingOut(true);

    // Clear the authentication tokens used by FlowDesk.
    localStorage.removeItem("flowdesk_access_token");
    localStorage.removeItem("flowdesk_refresh_token");

    // Notify other tabs that the session has changed.
    window.dispatchEvent(new Event("storage"));

    window.location.assign("/login");
  }

  const displayName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      profile.username ||
      "FlowDesk User"
    : "Loading account...";

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div>
          <p className="settings-eyebrow">PREFERENCES</p>
          <h1>Settings</h1>
          <p className="settings-subtitle">
            Manage your FlowDesk experience and personal preferences.
          </p>
        </div>
      </header>

      <section className="settings-account-card">
        <div className="settings-account-avatar">
          {(profile?.first_name?.[0] || profile?.username?.[0] || "U").toUpperCase()}
        </div>

        <div className="settings-account-info">
          <h2>{displayName}</h2>
          <p>{profile?.email || "Your FlowDesk account"}</p>
          {profile?.role && (
            <span className="settings-role">
              {String(profile.role).replaceAll("_", " ")}
            </span>
          )}
          {profileError && (
            <p className="settings-account-error">{profileError}</p>
          )}
        </div>

        <a className="settings-profile-link" href="/profile">
          View profile <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon purple">◈</span>
          <div>
            <h2>Workspace preferences</h2>
            <p>Adjust how information appears on your screen.</p>
          </div>
        </div>

        <div className="settings-option">
          <div className="settings-option-copy">
            <h3>Compact view</h3>
            <p>Preference for a denser workspace layout.</p>
          </div>
          <button
            type="button"
            className={`settings-toggle ${settings.compactView ? "on" : ""}`}
            role="switch"
            aria-checked={settings.compactView}
            aria-label="Compact view"
            onClick={() => updateSetting("compactView", !settings.compactView)}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon blue">♧</span>
          <div>
            <h2>Notification preferences</h2>
            <p>Choose which notification preferences you want to keep enabled.</p>
          </div>
        </div>

        <div className="settings-option">
          <div className="settings-option-copy">
            <h3>Task reminders</h3>
            <p>Preference for reminders about assigned tasks.</p>
          </div>
          <button
            type="button"
            className={`settings-toggle ${settings.showTaskReminders ? "on" : ""}`}
            role="switch"
            aria-checked={settings.showTaskReminders}
            aria-label="Task reminders"
            onClick={() =>
              updateSetting("showTaskReminders", !settings.showTaskReminders)
            }
          >
            <span />
          </button>
        </div>

        <div className="settings-option">
          <div className="settings-option-copy">
            <h3>Project updates</h3>
            <p>Preference for notifications about project activity.</p>
          </div>
          <button
            type="button"
            className={`settings-toggle ${settings.showProjectUpdates ? "on" : ""}`}
            role="switch"
            aria-checked={settings.showProjectUpdates}
            aria-label="Project updates"
            onClick={() =>
              updateSetting("showProjectUpdates", !settings.showProjectUpdates)
            }
          >
            <span />
          </button>
        </div>

        <div className="settings-option">
          <div className="settings-option-copy">
            <h3>Email alerts</h3>
            <p>Preference for receiving updates by email, if supported.</p>
          </div>
          <button
            type="button"
            className={`settings-toggle ${settings.showEmailAlerts ? "on" : ""}`}
            role="switch"
            aria-checked={settings.showEmailAlerts}
            aria-label="Email alerts"
            onClick={() =>
              updateSetting("showEmailAlerts", !settings.showEmailAlerts)
            }
          >
            <span />
          </button>
        </div>

        <p className="settings-note">
          These options save your preferences in this browser. They do not
          change server-side notification delivery.
        </p>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="settings-section-icon green">✓</span>
          <div>
            <h2>Account and security</h2>
            <p>Manage access to your current session.</p>
          </div>
        </div>

        <div className="settings-security-row">
          <div>
            <h3>Signed-in account</h3>
            <p>
              Your FlowDesk session uses your existing login credentials.
            </p>
          </div>
          <span className="settings-session-badge">Current session</span>
        </div>

        <div className="settings-security-row">
          <div>
            <h3>Sign out</h3>
            <p>End your current session on this browser.</p>
          </div>
          <button
            type="button"
            className="settings-logout-button"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </section>

      <footer className="settings-footer">
        <div>
          <h3>Save your preferences</h3>
          <p>Your preferences are stored locally in this browser.</p>
        </div>
        <div className="settings-footer-actions">
          <button
            type="button"
            className="settings-reset-button"
            onClick={resetPreferences}
          >
            Reset
          </button>
          <button
            type="button"
            className="settings-save-button"
            onClick={savePreferences}
          >
            Save preferences
          </button>
        </div>
      </footer>

      {savedMessage && (
        <div className="settings-feedback" role="status">
          {savedMessage}
        </div>
      )}
    </main>
  );
}
