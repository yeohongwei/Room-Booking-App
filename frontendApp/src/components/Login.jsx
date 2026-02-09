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
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Login</h2>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 10, maxWidth: 420 }}
      >
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
          {loading ? "Logging in..." : "Login"}
        </button>

        {errorMsg ? <div>{errorMsg}</div> : null}
      </form>
    </div>
  );
};

export default Login;
