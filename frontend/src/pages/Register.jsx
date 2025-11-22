import React, { useState } from "react";
import axios from "axios";
const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    useremail: "",
    userpassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:3000/bookstore/api/user/register", formData)
      .then((res) => { alert("Registration Successful"); })
      .catch(() => { alert("Registration Failed"); });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Create account</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full px-3 py-2 border rounded"/>
          <input name="useremail" value={formData.useremail} onChange={handleChange} placeholder="Email" type="email" className="w-full px-3 py-2 border rounded"/>
          <input name="userpassword" value={formData.userpassword} onChange={handleChange} placeholder="Password" type="password" className="w-full px-3 py-2 border rounded"/>
          <button type="submit" className="w-full py-2 bg-red-600 text-white rounded">Register</button>
        </form>
        <p className="text-sm text-center mt-4">Already have an account? <a href="/login" className="text-red-600">Login</a></p>
      </div>
    </div>
  );
};

export default Register;
