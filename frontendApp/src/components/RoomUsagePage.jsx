import React, { useContext } from "react";
import UserContext from "../context/user";
import { Navigate } from "react-router";

const RoomUsagePage = () => {
  const userCtx = useContext(UserContext);
  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";

  if (!isAdmin) return <Navigate to="/bookings" replace />;

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Room Usage Overview</h2>
    </div>
  );
};

export default RoomUsagePage;
