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
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Room and Equipment</h2>

      {loading ? <div>Loading...</div> : null}
      {statusMsg ? <div>{statusMsg}</div> : null}
      {errorMsg ? <div>{errorMsg}</div> : null}

      <h3>Room details</h3>
      <form
        onSubmit={updateRoom}
        style={{ display: "grid", gap: 10, maxWidth: 520 }}
      >
        <label>
          Name
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
        </label>

        <label>
          Capacity
          <input
            type="number"
            min={1}
            value={editCapacity}
            onChange={(e) => setEditCapacity(e.target.value)}
            required
          />
        </label>

        <label>
          Location
          <input
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
          />
        </label>

        <button type="submit">Update room</button>
      </form>

      <h3 style={{ marginTop: 16 }}>Equipment for room</h3>
      {room && Array.isArray(room.equipments) && room.equipments.length ? (
        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          {room.equipments.map((e) => (
            <div key={e.id} style={{ padding: 12, border: "1px solid" }}>
              <div style={{ marginBottom: 6 }}>
                <strong>{e.code}</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <label>
                  Quantity
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
                    style={{ marginLeft: 8, width: 100 }}
                  />
                </label>
                <button type="button" onClick={() => removeEquipment(e.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>No equipment assigned.</div>
      )}

      <form
        onSubmit={addEquipment}
        style={{ display: "grid", gap: 10, maxWidth: 520 }}
      >
        <div>
          <strong>Add equipment</strong>
        </div>

        <label>
          Equipment
          <select
            value={addEquipmentId}
            onChange={(e) => setAddEquipmentId(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {allEquipments.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.code} - {e.display_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantity
          <input
            type="number"
            min={1}
            value={addQuantity}
            onChange={(e) => setAddQuantity(e.target.value)}
          />
        </label>

        <button type="submit">Add</button>
      </form>
    </div>
  );
};

export default RoomAndEquipmentPage;
