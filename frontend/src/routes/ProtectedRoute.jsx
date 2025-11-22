import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protects routes — redirects to /login when not authenticated.
 * Usage:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 */
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  const isAuth = auth?.isAuthenticated || Boolean(JSON.parse(localStorage.getItem("user"))?.token);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;