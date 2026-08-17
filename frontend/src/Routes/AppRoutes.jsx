import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../Pages/Login";
import Register from "../Pages/Register";
import Profile from "../Pages/Profile";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* PROTECTED */}

      <Route element={<ProtectedRoute />}>

        <Route
          path="/profile"
          element={<Profile />}
        />

      </Route>

      {/* DEFAULT */}

      <Route
        path="/"
        element={
          <Navigate
            to="/profile"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/profile"
            replace
          />
        }
      />

    </Routes>
  );
}