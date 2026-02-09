import React, { useContext, useState } from "react";
import { useNavigate } from "react-router";
import UserContext from "../context/user";

const Registration = () => {
  const userCtx = useContext(UserContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const registerThenLogin = async () => {
    // Register
    const regRes = await fetch(import.meta.env.VITE_SERVER + "/auth/register", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const regCT = regRes.headers.get("content-type") || "";
    const regData = await (async () => {
      if (!regCT.includes("application/json")) return await regRes.text();
      const t = await regRes.text();
      if (!t) return null;
      try {
        return JSON.parse(t);
      } catch {
        return t;
      }
    })();

    if (!regRes.ok) {
      const msg =
        (regData &&
          typeof regData === "object" &&
          (regData.msg || regData.message)) ||
        (typeof regData === "string" ? regData : null) ||
        `Registration failed (${regRes.status})`;
      return { ok: false, msg };
    }

    // Login (backend registration does not return tokens)
    const loginRes = await fetch(import.meta.env.VITE_SERVER + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginCT = loginRes.headers.get("content-type") || "";
    const loginData = await (async () => {
      if (!loginCT.includes("application/json")) return await loginRes.text();
      const t = await loginRes.text();
      if (!t) return null;
      try {
        return JSON.parse(t);
      } catch {
        return t;
      }
    })();

    if (!loginRes.ok) {
      const msg =
        (loginData &&
          typeof loginData === "object" &&
          (loginData.msg || loginData.message)) ||
        (typeof loginData === "string" ? loginData : null) ||
        `Login failed (${loginRes.status})`;
      return { ok: false, msg };
    }

    const access = loginData?.access;
    const refresh = loginData?.refresh;
    if (!access || !refresh) {
      return { ok: false, msg: "Login succeeded but token(s) missing" };
    }

    return { ok: true, access, refresh };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setLoading(true);

    try {
      const res = await registerThenLogin();
      if (!res.ok) {
        setErrorMsg(res.msg || "Registration failed");
        setLoading(false);
        return;
      }

      userCtx.setName?.(name);
      userCtx.setEmail?.(email);
      userCtx.setAccessToken(res.access);
      userCtx.setRefreshToken?.(res.refresh);
      setStatusMsg("Registered and logged in");
      navigate("/bookings", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Registration</h2>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 10, maxWidth: 420 }}
      >
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        {statusMsg ? <div>{statusMsg}</div> : null}
        {errorMsg ? <div>{errorMsg}</div> : null}
      </form>
    </div>
  );
};

export default Registration;
