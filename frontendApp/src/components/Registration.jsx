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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Registration
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Create an account to start booking rooms.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {statusMsg ? (
            <div className="text-sm text-emerald-700">{statusMsg}</div>
          ) : null}
          {errorMsg ? (
            <div className="text-sm text-red-600">{errorMsg}</div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default Registration;
