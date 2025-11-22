import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() || {};

  // ensure axios Authorization header if token present
  if (!axios.defaults.headers.common?.Authorization) {
    const token = auth.user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  const resolveUserId = () => auth.user?.userId || JSON.parse(localStorage.getItem("user"))?.userId;

  const [carts, setCarts] = useState(location.state || []);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      const userId = resolveUserId();
      if (!userId) { setLoading(false); navigate("/login"); return; }
      try {
        const res = await axios.get(`http://localhost:3000/bookstore/api/cart?userId=${userId}`);
        setCarts(res.data.rows || []);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to fetch cart");
      } finally {
        setLoading(false);
      }
    };
    if (!location.state) fetchCart();
    else setCarts(location.state);
  }, [location.state, navigate, auth.user]);

  const formatCurrency = (v) => `₹${Number(v || 0).toFixed(2)}`;
  const totalPrice = carts.reduce((sum, b) => sum + Number(b.price || 0) * Number(b.quantity || 1), 0);

  const broadcastCartUpdated = () => {
    try { window.dispatchEvent(new Event("cartUpdated")); } catch (e) {}
  };

  const deleteCart = async (cart) => {
    const ok = window.confirm(`Remove "${cart.title}" from cart?`);
    if (!ok) return;
    const userId = cart.user_id || resolveUserId();
    const bookId = cart.book_id;
    if (!userId || !bookId) {
      alert("Missing identifiers");
      return;
    }
    try {
      await axios.delete(`http://localhost:3000/bookstore/api/cart/${userId}/${bookId}`);
      setCarts((prev) => prev.filter((it) => !(it.user_id == userId && it.book_id == bookId)));
      broadcastCartUpdated();
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
      else alert(err.response?.data?.message || "Delete failed");
    }
  };

  const updateQuantity = async (item, newQty) => {
    if (newQty < 1) return;
    const userId = item.user_id || resolveUserId();
    const bookId = item.book_id;
    if (!userId || !bookId) {
      alert("Missing identifiers");
      return;
    }

    // optimistic UI
    setCarts((prev) => prev.map((it) => (it.user_id === userId && it.book_id === bookId ? { ...it, quantity: newQty } : it)));
    setSavingId(bookId);
    try {
      await axios.put("http://localhost:3000/bookstore/api/cart", {
        user_id: userId,
        book_id: bookId,
        quantity: newQty,
      });
      broadcastCartUpdated();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update quantity");
      // revert by refetching cart
      const res = await axios.get(`http://localhost:3000/bookstore/api/cart?userId=${userId}`).catch(() => null);
      if (res?.data?.rows) setCarts(res.data.rows || []);
    } finally {
      setSavingId(null);
    }
  };

  const handleQtyInput = (item, value) => {
    const v = Math.max(1, Number(value || 1));
    setCarts((prev) => prev.map((it) => (it.user_id === item.user_id && it.book_id === item.book_id ? { ...it, quantity: v } : it)));
  };

  const buyAll = async () => {
    if (carts.length === 0) return;
    const userId = resolveUserId();
    if (!userId) { navigate("/login"); return; }

    if (!window.confirm(`Proceed to buy all items for ${formatCurrency(totalPrice)} ?`)) return;

    setBuying(true);
    try {
      const res = await axios.post("http://localhost:3000/bookstore/api/order/buy-cart", { userId });
      alert(res.data.message || `Purchase successful — total ${formatCurrency(res.data.total)}`);
      setCarts([]);
      broadcastCartUpdated();
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
      else alert(err.response?.data?.message || "Purchase failed");
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div>Loading…</div></div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>

      {carts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="mb-4">Your cart is empty.</p>
          <button onClick={() => navigate("/dashboard")} className="px-4 py-2 bg-red-600 text-white rounded">Browse Books</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {carts.map((book) => (
              <div key={`${book.user_id}-${book.book_id}`} className="flex gap-4 p-4 bg-white rounded shadow">
                <img src={book.bookImage || book.book_image || "https://via.placeholder.com/120x160?text=No+Image"} alt={book.title} className="w-28 h-36 object-cover rounded"/>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="font-semibold">{book.title}</h2>
                      <p className="text-sm text-gray-500">by {book.author || book.username || "Unknown"}</p>
                    </div>
                    <button onClick={() => deleteCart(book)} className="text-red-600">Remove</button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center border rounded px-2 py-1">
                      <button className="px-2" onClick={() => updateQuantity(book, Math.max(1, Number(book.quantity || 1) - 1))} disabled={savingId === book.book_id}>-</button>
                      <input
                        className="w-12 text-center"
                        type="number"
                        min="1"
                        value={book.quantity}
                        onChange={(e) => handleQtyInput(book, e.target.value)}
                        onBlur={() => updateQuantity(book, Number(book.quantity || 1))}
                      />
                      <button className="px-2" onClick={() => updateQuantity(book, Number(book.quantity || 1) + 1)} disabled={savingId === book.book_id}>+</button>
                    </div>

                    <div className="ml-auto text-right">
                      <div className="text-sm text-gray-600">Price</div>
                      <div className="font-semibold">{formatCurrency(book.price)}</div>
                      <div className="text-sm text-gray-600 mt-1">Subtotal: {formatCurrency((book.price || 0) * (book.quantity || 1))}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="flex justify-between mb-1"><span>Items</span><span>{carts.length}</span></div>
            <div className="flex justify-between mb-4"><span>Total</span><span className="font-bold">{formatCurrency(totalPrice)}</span></div>
            <button onClick={buyAll} disabled={buying} className={`w-full py-2 ${buying ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"} text-white rounded mb-2`}>
              {buying ? "Processing…" : "Buy All"}
            </button>
            <button onClick={() => navigate("/dashboard")} className="w-full  py-2 border rounded">Continue Shopping</button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
