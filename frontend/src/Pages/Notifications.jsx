import { useEffect, useState } from "react";
import api from "../Services/api";
import "./Notifications.css";

function getNotifications(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getMessage(notification) {
  return (
    notification.message ||
    notification.text ||
    notification.description ||
    notification.title ||
    "You have a new update."
  );
}

function getDate(notification) {
  const value =
    notification.created_at ||
    notification.timestamp ||
    notification.date_created;

  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isRead(notification) {
  return (
    notification.is_read === true ||
    notification.read === true
  );
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/notifications/");
      setNotifications(getNotifications(response.data));
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session may have expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError(
          "Your account does not have permission to view notifications."
        );
      } else {
        setError(
          "Notifications could not be loaded. Check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !isRead(notification)
  ).length;

  const filteredNotifications = notifications.filter(
    (notification) => {
      if (filter === "unread") return !isRead(notification);
      if (filter === "read") return isRead(notification);
      return true;
    }
  );

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <p className="notifications-eyebrow">WORKSPACE UPDATES</p>
          <h1>Notifications</h1>
          <p className="notifications-subtitle">
            Keep up with task assignments, project updates, and
            important activity across FlowDesk.
          </p>
        </div>

        <button
          type="button"
          className="notifications-refresh"
          onClick={loadNotifications}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error && (
        <section className="notifications-error" role="alert">
          <span className="notifications-error-icon">!</span>
          <div>
            <h2>Unable to load notifications</h2>
            <p>{error}</p>
            <button type="button" onClick={loadNotifications}>
              Try again
            </button>
          </div>
        </section>
      )}

      <section className="notifications-summary">
        <article className="notifications-summary-card">
          <div className="notifications-summary-icon total-icon">
            <span>▤</span>
          </div>
          <div>
            <p>Total notifications</p>
            <h2>{loading ? "—" : notifications.length}</h2>
          </div>
        </article>

        <article className="notifications-summary-card">
          <div className="notifications-summary-icon unread-icon">
            <span>●</span>
          </div>
          <div>
            <p>Unread notifications</p>
            <h2>{loading ? "—" : unreadCount}</h2>
          </div>
        </article>
      </section>

      <section className="notifications-content">
        <div className="notifications-content-header">
          <div>
            <h2>Your activity</h2>
            <p>Updates related to your workspace.</p>
          </div>

          <span className="notifications-count">
            {filteredNotifications.length}{" "}
            {filteredNotifications.length === 1
              ? "notification"
              : "notifications"}
          </span>
        </div>

        <div className="notifications-filters">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread
            {!loading && unreadCount > 0 && (
              <span className="notifications-filter-badge">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={filter === "read" ? "active" : ""}
            onClick={() => setFilter("read")}
          >
            Read
          </button>
        </div>

        {loading ? (
          <div className="notifications-state">
            <div className="notifications-spinner" />
            <p>Loading your notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">♧</div>
            <h3>
              {error
                ? "Notifications are unavailable"
                : filter === "unread"
                  ? "You're all caught up"
                  : filter === "read"
                    ? "No read notifications"
                    : "No notifications yet"}
            </h3>
            <p>
              {error
                ? "Resolve the connection or permission issue, then try again."
                : filter === "unread"
                  ? "There are no unread updates to review."
                  : filter === "read"
                    ? "Notifications you have read will appear here."
                    : "When workspace updates become available, they will appear here."}
            </p>

            {filter !== "all" && (
              <button
                type="button"
                className="notifications-show-all"
                onClick={() => setFilter("all")}
              >
                Show all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification, index) => {
              const read = isRead(notification);

              return (
                <article
                  className={`notification-item ${read ? "is-read" : "is-unread"}`}
                  key={
                    notification.id ??
                    notification.pk ??
                    `${getDate(notification)}-${index}`
                  }
                >
                  <div
                    className={`notification-item-icon ${read ? "read-icon" : "new-icon"}`}
                  >
                    {read ? "✓" : "●"}
                  </div>

                  <div className="notification-item-body">
                    <div className="notification-item-heading">
                      <h3>
                        {notification.title || "Workspace update"}
                      </h3>
                      {!read && (
                        <span className="notification-new-badge">
                          New
                        </span>
                      )}
                    </div>

                    <p className="notification-message">
                      {getMessage(notification)}
                    </p>

                    <div className="notification-item-meta">
                      <span>◷ {getDate(notification)}</span>
                      {notification.type && (
                        <span className="notification-type">
                          {String(notification.type).replaceAll("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Notifications;