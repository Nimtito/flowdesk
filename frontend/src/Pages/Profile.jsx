import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">

      <div className="profile-header">
        <div>
          <p className="profile-eyebrow">
            FLOWDESK ACCOUNT
          </p>

          <h1>
            Your Profile
          </h1>

          <p>
            Manage and view your authenticated FlowDesk account.
          </p>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="profile-card">

        <div className="profile-avatar">
          {(
            user.first_name ||
            user.username ||
            "U"
          )
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="profile-main">
          <h2>
            {user.first_name ||
              user.username}
            {" "}
            {user.last_name || ""}
          </h2>

          <p>
            @{user.username}
          </p>
        </div>

      </div>

      <div className="profile-details">

        <div className="profile-detail">
          <span>Username</span>
          <strong>
            {user.username || "—"}
          </strong>
        </div>

        <div className="profile-detail">
          <span>Email</span>
          <strong>
            {user.email || "—"}
          </strong>
        </div>

        <div className="profile-detail">
          <span>First name</span>
          <strong>
            {user.first_name || "—"}
          </strong>
        </div>

        <div className="profile-detail">
          <span>Last name</span>
          <strong>
            {user.last_name || "—"}
          </strong>
        </div>

        <div className="profile-detail">
          <span>Phone</span>
          <strong>
            {user.phone_number || "—"}
          </strong>
        </div>

        <div className="profile-detail">
          <span>Role</span>
          <strong>
            {user.role || "—"}
          </strong>
        </div>

      </div>

    </div>
  );
}