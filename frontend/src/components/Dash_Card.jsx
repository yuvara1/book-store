import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dash_card = ({ book }) => {
  const navigate = useNavigate();
  const auth = useAuth() || {};

  const pushToCart = async () => {
    const userId = auth.user?.userId || JSON.parse(localStorage.getItem("user"))?.userId;
    if (!userId) { navigate("/login"); return; }
    try {
      await axios.post("http://localhost:3000/bookstore/api/cart", { bookId: book.bookId, userId });
      alert(`Added "${book.title}" to cart!`);
    } catch (err) {
      alert(err.response?.data?.message || "Add to cart failed");
    }
  };

  const fullStars = "★".repeat(book.ratings || 0);
  const emptyStars = "☆".repeat(5 - (book.ratings || 0));

  return (
    <article className="bg-white rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition p-4 flex flex-col items-center text-center">
      <div className="w-36 h-52 mb-3 overflow-hidden rounded-lg">
        <img src={book.bookImage || "https://via.placeholder.com/128x180?text=No+Image"} alt={book.title} className="w-full h-full object-cover"/>
      </div>

      <h3 className="font-semibold text-base text-brown-700">{book.title}</h3>
      <p className="text-sm text-gray-500 mb-2">{book.author}</p>

      <div className="text-yellow-500 mb-2 text-sm">
        {fullStars}{emptyStars}
      </div>

      <div className="mb-3 font-semibold text-brown-800">₹{book.price}</div>

      <button onClick={pushToCart} className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition">
        Add to Cart
      </button>
    </article>
  );
};

export default Dash_card;
