import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {useNavigate} from "react-router-dom";
const Header = ({ cart = [], setSerachTitle = () => {}, setSearchAuthor = () => {}, showSearch = true }) => {
  const auth = useAuth();
  const user = auth?.user || null;
  const logout = auth?.logout || (() => {});
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center gap-4 md:gap-6">
      {showSearch && (
        <div className="flex-1 w-full md:max-w-lg flex gap-3">
          <input
            type="text"
            placeholder="Search by Title"
            onChange={(e) => setSerachTitle(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          <input
            type="text"
            placeholder="Search by Author"
            onChange={(e) => setSearchAuthor(e.target.value)}
            className="w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200 hidden sm:block"
          />
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        <button onClick={() => navigate(-1)} className="hidden md:inline-flex items-center gap-2 px-3 py-3 rounded-md border border-gray-200 bg-white text-sm">
              Go back
        </button>
        <Link state={cart} to="/cart" className="relative inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-md shadow hover:bg-red-700">
          🛒 Cart
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-white text-red-700 font-semibold">
            {cart.length}
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">Hi, <strong>{user.username}</strong></span>
            <button onClick={logout} className="px-3 py-1 rounded-md bg-gray-100 border text-sm hover:bg-gray-200">Logout</button>
          </div>
        ) }
      </div>
    </div>
  );
};

export default Header;
