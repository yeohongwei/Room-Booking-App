import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import sharedFetch from "../shared/sharedFetch";
import UserContext from "../context/user";

const RoomsPage = () => {
  const userCtx = useContext(UserContext);
  const navigate = useNavigate();

  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";

  const [rooms, setRooms] = useState([]);
  const [equipmentNameByCode, setEquipmentNameByCode] = useState({});
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

    const loadEquipmentNames = async () => {
      const res = await fetchData(
        "/equipments",
        "GET",
        null,
        userCtx.accessToken,
      );
      if (!res.ok) return;
      const list = Array.isArray(res.data) ? res.data : [];
      const map = {};
      for (const eq of list) {
        if (eq?.code) map[String(eq.code)] = eq.display_name || eq.code;
      }
      setEquipmentNameByCode(map);
    };
    loadEquipmentNames();
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Rooms
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Browse rooms and check availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Capacity</span>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All</option>
              <option value="LE4">4 and below</option>
              <option value="5TO12">5 to 12</option>
              <option value="GE13">13 and above</option>
            </select>
          </label>

          <button
            type="button"
            onClick={loadRooms}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-600">Loading...</div>
      ) : null}
      {errorMsg ? (
        <div className="mt-4 text-sm text-red-600">{errorMsg}</div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900">
                  {r.name}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Capacity: {r.capacity}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Location: {r.location || "-"}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-700">
              <span className="font-medium">Equipment:</span>{" "}
              {Array.isArray(r.equipments) && r.equipments.length
                ? r.equipments
                    .map((e) => {
                      const name =
                        e.display_name || equipmentNameByCode[e.code] || e.code;
                      return `${name} x${e.quantity}`;
                    })
                    .join(", ")
                : "-"}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(`/rooms/${r.id}`)}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                View Availability
              </button>

              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/roomequipment/${r.id}`)}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Update Room & equipment
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = window.confirm(
                        "All bookings for the room will be removed as well. Do you wish to continue?",
                      );
                      if (!ok) return;

                      const res = await fetchData(
                        `/rooms/${r.id}`,
                        "DELETE",
                        {},
                        userCtx.accessToken,
                      );
                      if (!res.ok) {
                        setErrorMsg(res.msg || "Delete room failed");
                        return;
                      }
                      await loadRooms();
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete room
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsPage;
