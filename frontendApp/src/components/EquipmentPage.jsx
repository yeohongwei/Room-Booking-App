import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const CODE_OPTIONS = ["projector", "whiteboard", "video conferencing"];

const EquipmentPage = () => {
  const userCtx = useContext(UserContext);
  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";

  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [editing, setEditing] = useState(null);
  const [editCode, setEditCode] = useState(CODE_OPTIONS[0]);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMsg, setEditMsg] = useState("");
  const [editIsError, setEditIsError] = useState(false);

  const [newCode, setNewCode] = useState(CODE_OPTIONS[0]);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMsg, setNewMsg] = useState("");

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

    const res = await fetchData(
      "/equipments",
      "GET",
      null,
      userCtx.accessToken,
    );
    if (!res.ok) {
      setEquipments([]);
      setErrorMsg(res.msg || "Failed to load equipments");
      setLoading(false);
      return;
    }

    setEquipments(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/bookings" replace />;

  const openEdit = (e) => {
    setEditing(e);
    setEditCode(e.code || CODE_OPTIONS[0]);
    setEditDisplayName(e.display_name || "");
    setEditDescription(e.description || "");
    setEditMsg("");
    setEditIsError(false);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditMsg("");
    setEditIsError(false);
  };

  const saveEdit = async () => {
    if (!editing) return;

    const res = await fetchData(
      `/equipments/${editing.id}`,
      "PATCH",
      {
        code: editCode,
        display_name: editDisplayName,
        description: editDescription,
      },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setEditMsg(res.msg || "Update failed");
      setEditIsError(true);
      return;
    }

    closeEdit();
    await load();
  };

  const deleteEquipment = async (id) => {
    const res = await fetchData(
      `/equipments/${id}`,
      "DELETE",
      {},
      userCtx.accessToken,
    );
    if (!res.ok) {
      setErrorMsg(res.msg || "Delete failed");
      return;
    }
    await load();
  };

  const addEquipment = async (e) => {
    e.preventDefault();
    setNewMsg("");

    const res = await fetchData(
      "/equipments",
      "PUT",
      {
        code: newCode,
        display_name: newDisplayName,
        description: newDescription,
      },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setNewMsg(res.msg || "Add failed");
      return;
    }

    setNewMsg("Equipment added");
    setNewDisplayName("");
    setNewDescription("");
    await load();
  };

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Equipment</h2>

      {loading ? <div>Loading...</div> : null}
      {errorMsg ? <div>{errorMsg}</div> : null}

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        {equipments.map((e) => (
          <div key={e.id} style={{ padding: 12, border: "1px solid" }}>
            <div style={{ marginBottom: 6 }}>
              <strong>{e.display_name}</strong>
            </div>
            <div style={{ marginBottom: 6 }}>Code: {e.code}</div>
            <div style={{ marginBottom: 10 }}>
              Description: {e.description || "-"}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => openEdit(e)}>
                Update
              </button>
              <button type="button" onClick={() => deleteEquipment(e.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3>Add Equipment</h3>
      <form
        onSubmit={addEquipment}
        style={{ display: "grid", gap: 10, maxWidth: 520 }}
      >
        <label>
          Code
          <select value={newCode} onChange={(e) => setNewCode(e.target.value)}>
            {CODE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Display name
          <input
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
          />
        </label>

        <button type="submit">Add</button>
        {newMsg ? <div>{newMsg}</div> : null}
      </form>

      {editing ? (
        <dialog open style={{ padding: 16, maxWidth: 520, width: "100%" }}>
          <h3>Update Equipment</h3>

          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Code
              <select
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              >
                {CODE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Display name
              <input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </label>

            {editMsg ? (
              <div style={editIsError ? { color: "red" } : undefined}>
                {editMsg}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={saveEdit}>
                Save
              </button>
              <button type="button" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
};

export default EquipmentPage;
