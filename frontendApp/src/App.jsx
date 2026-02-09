import React, { useEffect, useMemo, useState } from "react";
import UserContext from "./context/user";
import { Navigate, Route, Routes } from "react-router";
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
import RoomAndEquipmentPage from "./components/RoomAndEquipmentPage";
import TopNav from "./components/TopNav";

const decodeClaims = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
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

  useEffect(() => {
    const hydrateUserProfile = async () => {
      if (!accessToken) return;

      try {
        const res = await fetch(import.meta.env.VITE_SERVER + "/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + accessToken,
          },
        });

        if (!res.ok) return;
        const contentType = res.headers.get("content-type") || "";
        const data = await (async () => {
          if (!contentType.includes("application/json"))
            return await res.text();
          const text = await res.text();
          if (!text) return null;
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        })();

        if (data && typeof data === "object") {
          if (data.id) setUserId(data.id);
          if (data.role) setRole(data.role);
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
        }
      } catch {
        // ignore
      }
    };

    hydrateUserProfile();
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
