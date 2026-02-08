import React, { use, useEffect, useState } from "react";
import UserContext from "../context/user";
import { Navigate } from "react-router";

const ProtectedRoute = (props) => {
  const userCtx = use(UserContext);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasAccessToken = userCtx.accessToken.length > 0;
  const hasRefreshToken =
    typeof localStorage !== "undefined" && localStorage.getItem("refreshToken");
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  useEffect(() => {
    const refreshTokenIfNeeded = async () => {
      // If we have a refresh token but no access token, refresh proactively
      if (!hasAccessToken && hasRefreshToken) {
        setIsRefreshing(true);
        try {
          const res = await fetch(
            import.meta.env.VITE_SERVER + "/users/refresh",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: hasRefreshToken }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const access = data?.access || data?.accessToken;
            if (access) {
              userCtx.setAccessToken(access);
            }
          } else {
            // Refresh failed, clear refresh token and redirect to login
            localStorage.removeItem("refreshToken");
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          localStorage.removeItem("refreshToken");
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    refreshTokenIfNeeded();
  }, [hasAccessToken, hasRefreshToken, userCtx]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while refreshing token
  if (isRefreshing) {
    return <div className="fitnessCard">Restoring session...</div>;
  }

  return props.children;
};

export default ProtectedRoute;
