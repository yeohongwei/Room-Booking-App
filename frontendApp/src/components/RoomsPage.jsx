import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import sharedFetch from "../shared/sharedFetch";
import UserContext from "../context/user";

const RoomsPage = () => {
  const userCtx = useContext(UserContext);
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("ALL");

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

  const loadRooms = async () => {
    setLoading(true);
    setErrorMsg("");

    const res = await fetchData("/rooms", "GET", null, userCtx.accessToken);
    if (!res.ok) {
      setRooms([]);
      setErrorMsg(res.msg || "Failed to load rooms");
      setLoading(false);
      return;
    }

    setRooms(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRooms = rooms.filter((r) => {
    const cap = Number(r.capacity);
    if (capacityFilter === "LE4") return cap <= 4;
    if (capacityFilter === "5TO12") return cap >= 5 && cap <= 12;
    if (capacityFilter === "GE13") return cap >= 13;
    return true;
  });

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Rooms</h2>

      <div
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <label>
          Capacity filter
          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="ALL">All</option>
            <option value="LE4">4 and below</option>
            <option value="5TO12">5 to 12</option>
            <option value="GE13">13 and above</option>
          </select>
        </label>
        <button type="button" onClick={loadRooms}>
          Refresh
        </button>
      </div>

      {loading ? <div>Loading...</div> : null}
      {errorMsg ? <div>{errorMsg}</div> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {filteredRooms.map((r) => (
          <div key={r.id} style={{ padding: 12, border: "1px solid" }}>
            <div style={{ marginBottom: 6 }}>
              <strong>{r.name}</strong>
            </div>
            <div style={{ marginBottom: 6 }}>Capacity: {r.capacity}</div>
            <div style={{ marginBottom: 6 }}>Location: {r.location || "-"}</div>
            <div style={{ marginBottom: 10 }}>
              Equipments:{" "}
              {Array.isArray(r.equipments) && r.equipments.length
                ? r.equipments.map((e) => `${e.code} x${e.quantity}`).join(", ")
                : "-"}
            </div>
            <button type="button" onClick={() => navigate(`/rooms/${r.id}`)}>
              View Availability
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsPage;
