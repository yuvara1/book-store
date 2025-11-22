import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const auth = useAuth();
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
          <Link to="/dashboard" className="text-sm text-gray-700 hover:text-red-600 transition">
            Dashboard
          </Link>
          <Link to="/home" className="text-sm text-gray-700 hover:text-red-600 transition">
            Browse
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <Link to="/cart" className="relative inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-md shadow hover:bg-red-700">
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-white text-red-700 font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

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
