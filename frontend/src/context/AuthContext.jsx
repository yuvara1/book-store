import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; }
  });

  // ensure axios has header synchronously on startup (avoids first-click unauthorized)
  if (user?.token) {
    axios.defaults.headers.common.Authorization = `Bearer ${user.token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }

  useEffect(() => {
    if (user?.token) axios.defaults.headers.common.Authorization = `Bearer ${user.token}`;
    else delete axios.defaults.headers.common.Authorization;
  }, [user]);

  const login = (payload) => {
    setUser(payload);
 
    if (payload?.userId) localStorage.setItem("userId", payload.userId);
    localStorage.setItem("user", JSON.stringify(payload));
    if (payload?.token) axios.defaults.headers.common.Authorization = `Bearer ${payload.token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    delete axios.defaults.headers.common.Authorization;
  };

  const isAuthenticated = Boolean(user?.token);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);