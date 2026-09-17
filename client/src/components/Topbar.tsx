import {
  Bell,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Topbar = () => {
  const {
    user,
  } = useAuth();

  const initial =
    user?.email
      ?.charAt(0)
      .toUpperCase() || "U";

  return (
    <header className="topbar">

      <div>
        <span className="topbar-label">
          Technoriya HRMS
        </span>
      </div>

      <div className="topbar-actions">

        <button
          type="button"
          className="icon-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
        </button>

        <div className="user-menu">

          <div className="avatar">
            {initial}
          </div>

          <div className="user-info">

            <strong>
              {user?.email}
            </strong>

            <span>
              {user?.role}
            </span>

          </div>

        </div>

      </div>

    </header>
  );
};

export default Topbar;