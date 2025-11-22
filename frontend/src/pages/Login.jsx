import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const login = auth?.login || (() => {});
  const [userData, setuserData] = useState({ useremail: "", userpassword: "" });

  const handleChange = (e) => setuserData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res = await axios.post("http://localhost:3000/bookstore/api/user/login", userData);
      if (res.data.success) {
        login({ token: res.data.token, username: res.data.username, userId: res.data.userId });
        localStorage.setItem("user", JSON.stringify({ token: res.data.token, username: res.data.username, userId: res.data.userId }));
        navigate("/");
      }
    } catch (error) { alert(error.response?.data?.message || "Login failed"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Welcome back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="useremail" value={userData.useremail} onChange={handleChange} placeholder="Email" type="email" className="w-full px-3 py-2 border rounded"/>
          <input name="userpassword" value={userData.userpassword} onChange={handleChange} placeholder="Password" type="password" className="w-full px-3 py-2 border rounded"/>
          <button type="submit" className="w-full py-2 bg-red-600 text-white rounded">Login</button>
        </form>
        <p className="text-sm text-center mt-4">Don’t have an account? <Link to="/register" className="text-red-600">Register</Link></p>
      </div>
    </div>
  );
};

export default Login;
