import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const CODE_OPTIONS = ["projector", "whiteboard", "video conferencing"];

const EquipmentPage = () => {
  const userCtx = useContext(UserContext);
  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";
  const editDialogRef = useRef(null);

  const formRowClass = "grid grid-cols-[120px_1fr] gap-2 items-center";
  const formRowTopClass = "grid grid-cols-[120px_1fr] gap-2 items-start";

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

  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;

    if (editing) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [editing]);

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
    editDialogRef.current?.close();
  };

  const onEditDialogClose = () => {
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Equipment
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Create, update, and manage the equipment catalogue.
        </p>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-600">Loading...</div>
      ) : null}
      {errorMsg ? (
        <div className="mt-4 text-sm text-red-600">{errorMsg}</div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipments.map((e) => (
          <div
            key={e.id}
            className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
          >
            <div className="text-base font-semibold text-slate-900">
              {e.display_name}
            </div>
            <div className="mt-1 text-sm text-slate-600">Code: {e.code}</div>
            <div className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Description:</span>{" "}
              {e.description || "-"}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEdit(e)}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => deleteEquipment(e.id)}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-xl rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
        <h3 className="text-base font-semibold text-slate-900">
          Add Equipment
        </h3>
        <form onSubmit={addEquipment} className="mt-4 grid gap-4">
          <label className={`${formRowClass} text-sm text-slate-700`}>
            <span className="font-medium">Code</span>
            <select
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CODE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className={`${formRowClass} text-sm text-slate-700`}>
            <span className="font-medium">Display name</span>
            <input
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className={`${formRowTopClass} text-sm text-slate-700`}>
            <span className="pt-2 font-medium">Description</span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add
          </button>
          {newMsg ? (
            <div className="text-sm text-slate-700">{newMsg}</div>
          ) : null}
        </form>
      </div>

      <dialog
        ref={editDialogRef}
        onClose={onEditDialogClose}
        className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {editing ? (
          <>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              Update Equipment
            </h3>

            <div className="mt-4 grid gap-4">
              <label className={`${formRowClass} text-sm text-slate-700`}>
                <span className="font-medium">Code</span>
                <select
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CODE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`${formRowClass} text-sm text-slate-700`}>
                <span className="font-medium">Display name</span>
                <input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <label className={`${formRowTopClass} text-sm text-slate-700`}>
                <span className="pt-2 font-medium">Description</span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {editMsg ? (
                <div
                  className={
                    editIsError
                      ? "text-sm text-red-600"
                      : "text-sm text-emerald-700"
                  }
                >
                  {editMsg}
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
};

export default EquipmentPage;
