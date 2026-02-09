import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const SetRolePage = () => {
  const userCtx = useContext(UserContext);
  const isAdmin = String(userCtx.role || "").toUpperCase() === "ADMIN";

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

  if (!isAdmin) return <Navigate to="/bookings" replace />;

  const openEdit = (u) => {
    if (u.id === userCtx.userId) return;
    setEditingUser(u);
    setNewRole(String(u.role || "USER").toUpperCase());
    setEditMsg("");
  };

  const closeEdit = () => {
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
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Set Role</h2>

      {loading ? <div>Loading...</div> : null}
      {errorMsg ? <div>{errorMsg}</div> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {users.map((u) => (
          <div key={u.id} style={{ padding: 12, border: "1px solid" }}>
            <div style={{ marginBottom: 6 }}>
              <strong>{u.name}</strong> ({u.email})
            </div>
            <div style={{ marginBottom: 10 }}>Role: {u.role}</div>

            <button
              type="button"
              onClick={() => openEdit(u)}
              disabled={u.id === userCtx.userId}
            >
              Set role
            </button>

            {u.id === userCtx.userId ? (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                You cannot change your own role.
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {editingUser ? (
        <dialog open style={{ padding: 16, maxWidth: 520, width: "100%" }}>
          <h3>Change user role</h3>

          <div style={{ marginBottom: 10 }}>
            {editingUser.name} ({editingUser.email})
          </div>

          <label>
            Role
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          {editMsg ? (
            <div style={{ marginTop: 10, color: "red" }}>{editMsg}</div>
          ) : null}

          <div
            style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <button type="button" onClick={saveRole}>
              Save
            </button>
            <button type="button" onClick={closeEdit}>
              Cancel
            </button>
          </div>
        </dialog>
      ) : null}
    </div>
  );
};

export default SetRolePage;
