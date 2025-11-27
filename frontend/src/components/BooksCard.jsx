import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BooksCard = ({ book, handleCart }) => {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const [qty, setQty] = useState(1);
  const price = Number(book.price || 0);
  const inStock = Number(book.stock || 0) > 0;

  const doAddToCart = async () => {
    
    let userId = localStorage.getItem("userId");
    if (!userId) userId = auth.user?.userId || JSON.parse(localStorage.getItem("user"))?.userId;
    console.log(userId)
    if (!userId) { navigate("/login"); return; }
    if (typeof handleCart === "function") return handleCart(book);
    try {
    
      const res = await axios.post("http://localhost:3000/bookstore/api/cart", { bookId: book.bookId,userId: userId});
      alert(res.data.message || "Added to cart");
    } catch (err) {
      alert(err.response?.data?.message || "Add to cart failed");
    }
  };

  const handleBuyNow = async () => {
    if (!inStock) { alert("Out of stock"); return; }
    try {
      const res = await axios.post("http://localhost:3000/bookstore/api/order/buy-now", { bookId: book.bookId, userId: auth.user?.userId || JSON.parse(localStorage.getItem("user"))?.userId, quantity: qty });
      doAddToCart();
      navigate("/cart");
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      else alert(error.response?.data?.message || "Purchase failed");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4 hover:shadow-lg transition">
      <div className="w-full md:w-40 h-56 overflow-hidden rounded">
        <img src={book.bookImage || book.img || "https://via.placeholder.com/140x200?text=No+Image"} alt={book.title} className="w-full h-full object-cover"/>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-lg">{book.title}</h4>
            <p className="text-sm text-gray-500">by {book.author}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">₹{price}</div>
            <div className={`text-sm ${inStock ? "text-green-600" : "text-red-600"}`}>{inStock ? `In stock: ${book.stock}` : "Out of stock"}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 border rounded px-2 py-1">
            <label className="text-sm">Qty</label>
            <input type="number" min="1" max={book.stock || 99} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} className="w-16 text-center px-2 py-1"/>
          </div>

          <button onClick={doAddToCart} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Add to cart</button>
          <button onClick={handleBuyNow} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Buy Now</button>
        </div>

        <p className="mt-3 text-sm text-yellow-500">Ratings: {"★".repeat(book.ratings || 0)}{"☆".repeat(5 - (book.ratings || 0))}</p>
      </div>
    </div>
  );
};

export default BooksCard;
