import React, { useContext, useState } from "react";
import { useNavigate } from "react-router";
import UserContext from "../context/user";

const Login = () => {
  const userCtx = useContext(UserContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch(import.meta.env.VITE_SERVER + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = await (async () => {
        if (!contentType.includes("application/json")) return await res.text();
        const text = await res.text();
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })();

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && (data.msg || data.message)) ||
          (typeof data === "string" ? data : null) ||
          `Login failed (${res.status})`;
        setErrorMsg(msg);
        setLoading(false);
        return;
      }

      const access = data?.access;
      const refresh = data?.refresh;
      if (!access || !refresh) {
        setErrorMsg("Login succeeded but token(s) missing");
        setLoading(false);
        return;
      }

      userCtx.setEmail?.(email);
      userCtx.setAccessToken(access);
      userCtx.setRefreshToken?.(refresh);

      navigate("/bookings", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Login
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to book rooms and manage your bookings.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
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
            {loading ? "Logging in..." : "Login"}
          </button>

          {errorMsg ? (
            <div className="text-sm text-red-600">{errorMsg}</div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default Login;
