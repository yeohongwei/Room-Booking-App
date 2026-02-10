import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const RoomAndEquipmentPage = () => {
  const { roomId } = useParams();
  const userCtx = useContext(UserContext);
  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";

  const [room, setRoom] = useState(null);
  const [allEquipments, setAllEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState(1);
  const [editLocation, setEditLocation] = useState("");

  const [addEquipmentId, setAddEquipmentId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);

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

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    setStatusMsg("");

    const roomRes = await fetchData(
      `/rooms/${roomId}`,
      "GET",
      null,
      userCtx.accessToken,
    );
    if (!roomRes.ok) {
      setErrorMsg(roomRes.msg || "Failed to load room");
      setLoading(false);
      return;
    }
    setRoom(roomRes.data);
    setEditName(roomRes.data?.name || "");
    setEditCapacity(roomRes.data?.capacity || 1);
    setEditLocation(roomRes.data?.location || "");

    const eqRes = await fetchData(
      "/equipments",
      "GET",
      null,
      userCtx.accessToken,
    );
    if (!eqRes.ok) {
      setErrorMsg(eqRes.msg || "Failed to load equipments");
      setAllEquipments([]);
      setLoading(false);
      return;
    }

    const list = Array.isArray(eqRes.data) ? eqRes.data : [];
    setAllEquipments(list);
    if (!addEquipmentId && list.length > 0) {
      setAddEquipmentId(String(list[0].id));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isAdmin]);

  if (!isAdmin) return <Navigate to="/bookings" replace />;

  const updateRoom = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");

    const res = await fetchData(
      `/rooms/${roomId}`,
      "PATCH",
      {
        name: editName,
        capacity: Number(editCapacity),
        location: editLocation,
      },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setErrorMsg(res.msg || "Failed to update room");
      return;
    }

    setStatusMsg("Room updated");
    await load();
  };

  const removeEquipment = async (equipmentId) => {
    const res = await fetchData(
      `/rooms/${roomId}/equipments/${equipmentId}`,
      "DELETE",
      {},
      userCtx.accessToken,
    );

    if (!res.ok) {
      setErrorMsg(res.msg || "Failed to remove equipment");
      return;
    }

    setStatusMsg("Equipment removed");
    await load();
  };

  const upsertEquipment = async (equipmentId, quantity) => {
    const res = await fetchData(
      `/rooms/${roomId}/equipments`,
      "PUT",
      { equipmentId: Number(equipmentId), quantity: Number(quantity) },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setErrorMsg(res.msg || "Failed to update equipment quantity");
      return;
    }

    setStatusMsg("Equipment updated");
    await load();
  };

  const addEquipment = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const res = await fetchData(
      `/rooms/${roomId}/equipments`,
      "PUT",
      { equipmentId: Number(addEquipmentId), quantity: Number(addQuantity) },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setErrorMsg(res.msg || "Failed to add equipment");
      return;
    }

    setStatusMsg("Equipment added to room");
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Room & Equipment
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Update room details and manage assigned equipment.
        </p>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-600">Loading...</div>
      ) : null}
      {statusMsg ? (
        <div className="mt-4 text-sm text-emerald-700">{statusMsg}</div>
      ) : null}
      {errorMsg ? (
        <div className="mt-4 text-sm text-red-600">{errorMsg}</div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="text-base font-semibold text-slate-900">
            Room details
          </h3>
          <form onSubmit={updateRoom} className="mt-4 grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">
                Capacity
              </span>
              <input
                type="number"
                min={1}
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">
                Location
              </span>
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Update room
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="text-base font-semibold text-slate-900">
            Equipment for room
          </h3>

          {room && Array.isArray(room.equipments) && room.equipments.length ? (
            <div className="mt-4 grid gap-3">
              {room.equipments.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {e.code}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="font-medium">Quantity</span>
                      <input
                        type="number"
                        min={1}
                        defaultValue={e.quantity}
                        onBlur={(ev) => {
                          const q = Number(ev.target.value);
                          if (Number.isFinite(q) && q > 0) {
                            upsertEquipment(e.id, q);
                          }
                        }}
                        className="w-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeEquipment(e.id)}
                      className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">
              No equipment assigned.
            </div>
          )}

          <form onSubmit={addEquipment} className="mt-6 grid gap-4">
            <div className="text-sm font-semibold text-slate-900">
              Add equipment
            </div>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">
                Equipment
              </span>
              <select
                value={addEquipmentId}
                onChange={(e) => setAddEquipmentId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {allEquipments.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.code} - {e.display_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">
                Quantity
              </span>
              <input
                type="number"
                min={1}
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomAndEquipmentPage;
