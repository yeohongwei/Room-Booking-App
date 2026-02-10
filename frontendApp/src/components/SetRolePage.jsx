import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const roleToLabel = (role) => {
  const upper = String(role || "").toUpperCase();
  if (upper === "ADMIN") return "Admin";
  if (upper === "USER") return "User";
  return role ? String(role) : "";
};

const SetRolePage = () => {
  const userCtx = useContext(UserContext);
  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";
  const editDialogRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("USER");
  const [editMsg, setEditMsg] = useState("");

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

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg("");

    const res = await fetchData(
      "/auth/users",
      "GET",
      null,
      userCtx.accessToken,
    );
    if (!res.ok) {
      setUsers([]);
      setErrorMsg(res.msg || "Failed to load users");
      setLoading(false);
      return;
    }

    setUsers(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;

    if (editingUser) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [editingUser]);

  if (!isAdmin) return <Navigate to="/bookings" replace />;

  const openEdit = (u) => {
    if (u.id === userCtx.userId) return;
    setEditingUser(u);
    setNewRole(String(u.role || "USER").toUpperCase());
    setEditMsg("");
  };

  const closeEdit = () => {
    editDialogRef.current?.close();
  };

  const onEditDialogClose = () => {
    setEditingUser(null);
    setEditMsg("");
  };

  const saveRole = async () => {
    if (!editingUser) return;

    if (editingUser.id === userCtx.userId) {
      setEditMsg("Cannot change your own role");
      return;
    }

    const res = await fetchData(
      `/auth/role/${editingUser.id}`,
      "PATCH",
      { role: newRole },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setEditMsg(res.msg || "Failed to update role");
      return;
    }

    closeEdit();
    await loadUsers();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Set Role
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage user roles (Admin/User).
        </p>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-600">Loading...</div>
      ) : null}
      {errorMsg ? (
        <div className="mt-4 text-sm text-red-600">{errorMsg}</div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
          >
            <div className="text-base font-semibold text-slate-900">
              {u.name}
            </div>
            <div className="mt-1 text-sm text-slate-600">{u.email}</div>
            <div className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Role:</span> {roleToLabel(u.role)}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => openEdit(u)}
                disabled={u.id === userCtx.userId}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Set role
              </button>
            </div>

            {u.id === userCtx.userId ? (
              <div className="mt-2 text-xs text-slate-500">
                You cannot change your own role.
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <dialog
        ref={editDialogRef}
        onClose={onEditDialogClose}
        className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {editingUser ? (
          <>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              Change user role
            </h3>

            <div className="mt-1 text-sm text-slate-600">
              {editingUser.name} ({editingUser.email})
            </div>

            <label className="mt-4 grid gap-1">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            {editMsg ? (
              <div className="mt-3 text-sm text-red-600">{editMsg}</div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveRole}
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
          </>
        ) : null}
      </dialog>
    </div>
  );
};

export default SetRolePage;
