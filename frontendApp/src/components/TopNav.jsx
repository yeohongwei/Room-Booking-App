import React from "react";
import { Link } from "react-router";

const roleToLabel = (role) => {
  const upper = String(role || "").toUpperCase();
  if (upper === "ADMIN") return "Admin";
  if (upper === "USER") return "User";
  return role ? String(role) : "";
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
        {role ? ` (${roleToLabel(role)})` : ""}
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
          </>
        ) : null}
      </div>
    </div>
  );
};

export default TopNav;
