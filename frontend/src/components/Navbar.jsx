import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const user = auth?.user || null;
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const userIdStored = user?.userId || JSON.parse(localStorage.getItem("user"))?.userId;

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // ensure Authorization header for subsequent requests
    if (token && !axios.defaults.headers.common.Authorization) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    let mounted = true;
    const loadCount = async () => {
      // prefer query userId fallback if token/header not usable
      try {
        const url = userIdStored
          ? `http://localhost:3000/bookstore/api/cart?userId=${userIdStored}`
          : "http://localhost:3000/bookstore/api/cart";
        const res = await axios.get(url);
        if (mounted) setCartCount(res.data.rows?.length || 0);
      } catch (err) {
        if (mounted) setCartCount(0);
      }
    };

    loadCount();

    const onStorage = (e) => {
      if (e.key === "user") loadCount();
    };
    const onCartUpdated = () => loadCount();

    window.addEventListener("storage", onStorage);
    window.addEventListener("cartUpdated", onCartUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cartUpdated", onCartUpdated);
    };
  }, [token, userIdStored]);

  const handleSignOut = () => {
    auth?.logout?.();
    try { window.dispatchEvent(new Event("cartUpdated")); } catch (e) {}
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-yellow-50 to-beige-50 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-red-600 flex items-center justify-center text-white font-bold shadow">
            BS
          </div>
          <span className="text-lg font-semibold text-brown-700">Book Store</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          
          <Link to="/home" className="text-sm text-gray-700 hover:text-red-600 transition">
            Browse
          </Link>
          {auth?.isAuthenticated && (
            <Link to="/orders" className="text-sm text-gray-700 hover:text-red-600 transition">
              Orders
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {auth?.user ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-700">
                Hi, <strong>{auth.user.username}</strong>
              </span>
              <Link to="/cart" className="inline-flex items-center  bg-red-600 text-white p-2 rounded-md shadow relative">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-white text-red-700 font-semibold">
                {cartCount}
              </span>
            )}
          </Link>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 rounded-md bg-gray-100 border text-sm hover:bg-gray-200"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="px-3 py-1 rounded-md bg-white border text-sm">
                Sign in
              </Link>
            </div>
          )}

          {/* mobile quick cart button */}
          <Link to="/cart" className="inline-flex items-center sm:hidden bg-red-600 text-white p-2 rounded-md shadow relative">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-white text-red-700 font-semibold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
