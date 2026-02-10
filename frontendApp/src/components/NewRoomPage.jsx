import React, { useContext, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const NewRoomPage = () => {
  const userCtx = useContext(UserContext);
  const navigate = useNavigate();
  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [location, setLocation] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = useMemo(
    () =>
      sharedFetch({
        getRefreshToken: () =>
          userCtx.refreshToken || localStorage.getItem("refreshToken"),
        setAccessToken: userCtx.setAccessToken,
        onAuthError: () => {
          userCtx.setRefreshToken?.("");
          userCtx.setAccessToken("");
        },
      }),
    [userCtx],
  );

  if (!isAdmin) return <Navigate to="/bookings" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");
    setLoading(true);

    const res = await fetchData(
      "/rooms",
      "PUT",
      {
        name,
        capacity: Number(capacity),
        location,
        is_active: true,
      },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setErrorMsg(res.msg || "Failed to create room");
      setLoading(false);
      return;
    }

    setStatusMsg("Room created");
    setLoading(false);
    navigate("/rooms", { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="max-w-xl rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          New Room
        </h2>
        <p className="mt-1 text-sm text-slate-600">Create a new room.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Capacity</span>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create"}
          </button>

          {statusMsg ? (
            <div className="text-sm text-emerald-700">{statusMsg}</div>
          ) : null}
          {errorMsg ? (
            <div className="text-sm text-red-600">{errorMsg}</div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default NewRoomPage;
