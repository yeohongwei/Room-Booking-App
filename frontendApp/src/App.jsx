import React, { useEffect, useMemo, useState } from "react";
import UserContext from "./context/user";
import { Link, Navigate, Route, Routes } from "react-router";
import { jwtDecode } from "jwt-decode";

import Login from "./components/Login";
import Registration from "./components/Registration";
import RoomsPage from "./components/RoomsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoomDetailsPage from "./components/RoomDetailsPage";
import BookingsPage from "./components/BookingsPage";

import SetRolePage from "./components/SetRolePage";
import NewRoomPage from "./components/NewRoomPage";
import EquipmentPage from "./components/EquipmentPage";
import RoomUsagePage from "./components/RoomUsagePage";
import RoomAndEquipmentPage from "./components/RoomAndEquipmentPage";

const decodeClaims = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

const TopNav = ({ isAuthenticated, name, role }) => {
  if (!isAuthenticated) {
    return (
      <div style={{ padding: "12px 16px" }}>
        <div style={{ marginBottom: 8 }}>Room Booking App</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/registration">Registration</Link>
          <Link to="/login">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ marginBottom: 8 }}>
        Welcome, {name || "User"}
        {role ? ` (${role})` : ""}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/registration">Registration</Link>
        <Link to="/login">Login</Link>
        <Link to="/rooms">Rooms</Link>
        <Link to="/bookings">Bookings</Link>
        {String(role || "").toUpperCase() === "ADMIN" ? (
          <>
            <Link to="/setrole">Set Role</Link>
            <Link to="/newroom">New Room</Link>
            <Link to="/equipment">Equipment</Link>
            <Link to="/roomusage">Rooms Usage</Link>
          </>
        ) : null}
      </div>
    </div>
  );
};

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState(() => {
    if (typeof localStorage === "undefined") return "";
    return localStorage.getItem("refreshToken") || "";
  });

  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const claims = decodeClaims(accessToken);
    if (claims?.id) setUserId(claims.id);
    if (claims?.role) setRole(claims.role);
  }, [accessToken]);

  const isAuthenticated =
    (accessToken && accessToken.length > 0) ||
    (refreshToken && refreshToken.length > 0);

  const ctxValue = useMemo(
    () => ({
      accessToken,
      setAccessToken,
      refreshToken,
      setRefreshToken: (value) => {
        const next = value || "";
        setRefreshToken(next);
        if (typeof localStorage !== "undefined") {
          if (next) localStorage.setItem("refreshToken", next);
          else localStorage.removeItem("refreshToken");
        }
      },
      role,
      setRole,
      userId,
      setUserId,
      name,
      setName,
      email,
      setEmail,
    }),
    [accessToken, refreshToken, role, userId, name, email],
  );

  return (
    <div>
      <UserContext.Provider value={ctxValue}>
        <TopNav
          isAuthenticated={isAuthenticated}
          name={name || email}
          role={role}
        />
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/bookings" : "/login"} replace />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />

          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <RoomsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <ProtectedRoute>
                <RoomDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/setrole"
            element={
              <ProtectedRoute>
                <SetRolePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/newroom"
            element={
              <ProtectedRoute>
                <NewRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment"
            element={
              <ProtectedRoute>
                <EquipmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roomusage"
            element={
              <ProtectedRoute>
                <RoomUsagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roomequipment/:roomId"
            element={
              <ProtectedRoute>
                <RoomAndEquipmentPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserContext.Provider>
    </div>
  );
}

export default App;
