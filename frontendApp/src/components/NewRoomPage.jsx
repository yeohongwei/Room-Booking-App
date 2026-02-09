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
    <div style={{ padding: "0 16px 16px" }}>
      <h2>New Room</h2>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 10, maxWidth: 420 }}
      >
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Capacity
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
        </label>

        <label>
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>

        {statusMsg ? <div>{statusMsg}</div> : null}
        {errorMsg ? <div>{errorMsg}</div> : null}
      </form>
    </div>
  );
};

export default NewRoomPage;
