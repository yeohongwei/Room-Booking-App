import React from "react";
import { Link } from "react-router";

const roleToLabel = (role) => {
  const upper = String(role || "").toUpperCase();
  if (upper === "ADMIN") return "Admin";
  if (upper === "USER") return "User";
  return role ? String(role) : "";
};

const NavLink = ({ to, children }) => (
  <Link
    to={to}
    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  >
    {children}
  </Link>
);

const TopNav = ({ isAuthenticated, name, role }) => {
  if (!isAuthenticated) {
    return (
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-lg font-semibold tracking-tight text-slate-900">
              RoomHive
            </div>
            <div className="text-sm text-slate-600">
              Book rooms, manage equipment, and stay organized.
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/registration">Registration</NavLink>
            <NavLink to="/login">Login</NavLink>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight text-slate-900">
            RoomHive
          </div>
          <div className="text-sm text-slate-600 sm:hidden">
            Welcome, {name || "User"}
            {role ? ` (${roleToLabel(role)})` : ""}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="hidden text-sm text-slate-600 sm:block">
            Welcome, {name || "User"}
            {role ? ` (${roleToLabel(role)})` : ""}
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/rooms">Rooms</NavLink>
            <NavLink to="/bookings">Bookings</NavLink>
            {String(role || "").toUpperCase() === "ADMIN" ? (
              <>
                <NavLink to="/setrole">Set Role</NavLink>
                <NavLink to="/newroom">New Room</NavLink>
                <NavLink to="/equipment">Equipment</NavLink>
              </>
            ) : null}
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/registration">Registration</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
