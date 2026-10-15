import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../Services/api";
import "./Notifications.css";

/* ========================================
   HELPER FUNCTIONS
======================================== */

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

function getTitle(notification) {
  return notification.title || "Workspace update";
}

function getDate(notification) {
  const value =
    notification.created_at ||
    notification.timestamp ||
    notification.date_created;

  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

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

function getNotificationId(notification) {
  return notification.id ?? notification.pk ?? null;
}

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return "Your session may have expired. Please log in again.";
  }

  if (status === 403) {
    return "Your account does not have permission to perform this action.";
  }

  if (status === 404) {
    return "The notification endpoint was not found.";
  }

  if (status === 405) {
    return "The server does not support this update action.";
  }

  if (!error?.response) {
    return "Could not connect to the server. Check your connection.";
  }

  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    "Something went wrong. Please try again."
  );
}

/* ========================================
   NOTIFICATIONS PAGE
======================================== */

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [updatingIds, setUpdatingIds] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);

  /* ========================================
     LOAD NOTIFICATIONS
  ======================================== */

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setActionError("");

    try {
      const response = await api.get("/notifications/");
      setNotifications(getNotifications(response.data));
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /* ========================================
     COUNTS AND FILTERING
  ======================================== */

  const unreadCount = notifications.filter(
    (notification) => !isRead(notification)
  ).length;

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === "unread") return !isRead(notification);
      if (filter === "read") return isRead(notification);
      return true;
    });
  }, [notifications, filter]);

  /* ========================================
     MARK ONE NOTIFICATION AS READ
  ======================================== */

  async function markAsRead(notification) {
    const id = getNotificationId(notification);

    if (id === null || isRead(notification)) {
      return;
    }

    if (updatingIds.includes(id)) {
      return;
    }

    setActionError("");
    setUpdatingIds((current) => [...current, id]);

    try {
      await api.patch(`/notifications/${id}/`, {
        is_read: true,
      });

      setNotifications((current) =>
        current.map((item) => {
          if (getNotificationId(item) !== id) {
            return item;
          }

          return {
            ...item,
            is_read: true,
            read: true,
          };
        })
      );
    } catch (err) {
      setActionError(
        `Could not mark "${getTitle(notification)}" as read. ${
          getErrorMessage(err)
        }`
      );

      console.error("Failed to update notification:", err);
    } finally {
      setUpdatingIds((current) =>
        current.filter((itemId) => itemId !== id)
      );
    }
  }

  /* ========================================
     MARK ALL NOTIFICATIONS AS READ
  ======================================== */

  async function markAllAsRead() {
    const unreadNotifications = notifications.filter(
      (notification) => !isRead(notification)
    );

    if (unreadNotifications.length === 0 || markingAll) {
      return;
    }

    const notificationsWithoutIds = unreadNotifications.filter(
      (notification) => getNotificationId(notification) === null
    );

    if (notificationsWithoutIds.length > 0) {
      setActionError(
        "Some notifications do not have an ID, so they cannot be updated."
      );
      return;
    }

    setMarkingAll(true);
    setActionError("");

    const results = await Promise.allSettled(
      unreadNotifications.map(async (notification) => {
        const id = getNotificationId(notification);

        await api.patch(`/notifications/${id}/`, {
          is_read: true,
        });

        return id;
      })
    );

    const successfulIds = new Set(
      results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value)
    );

    if (successfulIds.size > 0) {
      setNotifications((current) =>
        current.map((notification) => {
          if (!successfulIds.has(getNotificationId(notification))) {
            return notification;
          }

          return {
            ...notification,
            is_read: true,
            read: true,
          };
        })
      );
    }

    const failedCount = results.length - successfulIds.size;

    if (failedCount > 0) {
      setActionError(
        `${successfulIds.size} notification(s) marked as read. ` +
          `${failedCount} could not be updated. ` +
          "Your server may not support this update operation."
      );
    }

    setMarkingAll(false);
  }

  /* ========================================
     LOADING STATE
  ======================================== */

  if (loading) {
    return (
      <main className="notifications-page">
        <div className="notifications-state">
          <div className="notifications-spinner" />
          <p>Loading your notifications...</p>
        </div>
      </main>
    );
  }

  /* ========================================
     MAIN PAGE
  ======================================== */

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <p className="notifications-eyebrow">
            WORKSPACE UPDATES
          </p>

          <h1>Notifications</h1>

          <p className="notifications-subtitle">
            Keep up with task assignments, project updates,
            and important activity across FlowDesk.
          </p>
        </div>

        <button
          type="button"
          className="notifications-refresh"
          onClick={() => loadNotifications(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* LOAD ERROR */}

      {error && (
        <section className="notifications-error" role="alert">
          <span className="notifications-error-icon">!</span>

          <div>
            <h2>Unable to load notifications</h2>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => loadNotifications()}
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {/* ACTION ERROR */}

      {actionError && (
        <section
          className="notifications-action-error"
          role="alert"
        >
          <p>{actionError}</p>

          <button
            type="button"
            onClick={() => setActionError("")}
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </section>
      )}

      {/* SUMMARY CARDS */}

      <section className="notifications-summary">
        <article className="notifications-summary-card">
          <div className="notifications-summary-icon total-icon">
            <span>▤</span>
          </div>

          <div>
            <p>Total notifications</p>
            <h2>{notifications.length}</h2>
          </div>
        </article>

        <article className="notifications-summary-card">
          <div className="notifications-summary-icon unread-icon">
            <span>●</span>
          </div>

          <div>
            <p>Unread notifications</p>
            <h2>{unreadCount}</h2>
          </div>
        </article>
      </section>

      {/* NOTIFICATION LIST */}

      <section className="notifications-content">
        <div className="notifications-content-header">
          <div>
            <h2>Your activity</h2>
            <p>Updates related to your workspace.</p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="notifications-mark-all"
              onClick={markAllAsRead}
              disabled={markingAll}
            >
              {markingAll
                ? "Updating..."
                : "Mark all as read"}
            </button>
          )}
        </div>

        <div className="notifications-content-header">
          <span className="notifications-count">
            {filteredNotifications.length}{" "}
            {filteredNotifications.length === 1
              ? "notification"
              : "notifications"}
          </span>

          <span className="notifications-count">
            {readCount} read
          </span>
        </div>

        {/* FILTERS */}

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

            {unreadCount > 0 && (
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

        {/* EMPTY STATE */}

        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">✓</div>

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
                ? "Resolve the connection issue and try again."
                : filter === "unread"
                  ? "There are no unread updates to review."
                  : filter === "read"
                    ? "Notifications you have read will appear here."
                    : "Workspace updates will appear here when available."}
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
          /* NOTIFICATION ITEMS */

          <div className="notifications-list">
            {filteredNotifications.map((notification, index) => {
              const read = isRead(notification);
              const id = getNotificationId(notification);
              const updating = updatingIds.includes(id);

              return (
                <article
                  className={`notification-item ${
                    read ? "is-read" : "is-unread"
                  }`}
                  key={
                    id ??
                    `${getDate(notification)}-${index}`
                  }
                >
                  <div
                    className={`notification-item-icon ${
                      read ? "read-icon" : "new-icon"
                    }`}
                  >
                    {read ? "✓" : "●"}
                  </div>

                  <div className="notification-item-body">
                    <div className="notification-item-heading">
                      <h3>{getTitle(notification)}</h3>

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
                          {String(notification.type).replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      )}
                    </div>

                    {!read && (
                      <button
                        type="button"
                        className="notification-mark-read"
                        onClick={() => markAsRead(notification)}
                        disabled={updating || id === null}
                      >
                        {updating
                          ? "Updating..."
                          : "Mark as read"}
                      </button>
                    )}
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
