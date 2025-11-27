import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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

  // reusable cart fetch (used on mount and when "cartUpdated" event fires)
  const fetchCart = useCallback(async () => {
    setLoading(true);
    const userId = resolveUserId();
    if (!userId) { setLoading(false); navigate("/login"); return; }
    try {
      const res = await axios.get(`http://localhost:3000/bookstore/api/cart?userId=${userId}`);
      setCarts(res.data.rows || []);
    } catch (err) {
      // non-blocking: keep UI usable
      console.error("fetchCart:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate, auth.user]);

  useEffect(() => {
    // prefer navigation state (so reorder -> cart shows immediately),
    // otherwise fetch server cart
    if (!location.state) fetchCart();
    else setCarts(location.state);
  }, [location.state, fetchCart]);

  // listen for global cart updates (reorder, add-to-cart elsewhere)
  useEffect(() => {
    const onCartUpdated = () => {
      fetchCart();
    };
    window.addEventListener("cartUpdated", onCartUpdated);
    return () => window.removeEventListener("cartUpdated", onCartUpdated);
  }, [fetchCart]);

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-600">Loading…</div></div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Cart</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hidden md:inline-flex items-center gap-2 px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm">
              Go back
            </button>
          <Link to="/home" className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Continue shopping</Link>
          <button
            onClick={() => { auth?.logout?.(); navigate("/login"); }}
            className="px-4 py-2 bg-gray-100 border rounded-md text-sm hover:bg-gray-200"
          >
            Sign out
          </button>
        </div>
      </div>

      {carts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="mb-4 text-lg">Your cart is empty.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/home" className="px-5 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700">Browse Books</Link>
            <button onClick={() => navigate("/dashboard")} className="px-5 py-2 border rounded">Explore Picks</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {carts.map((book) => {
              const img = book.bookImage || book.book_image || "https://via.placeholder.com/160x220?text=No+Image";
              const inStock = Number(book.stock || book.stock_count || 0) > 0;
              return (
                <div key={`${book.user_id}-${book.book_id}`} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                  <div className="w-32 flex-shrink-0">
                    <img src={img} alt={book.title} className="w-full h-40 object-cover rounded-lg" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-lg line-clamp-2">{book.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">by {book.author || book.username || "Unknown"}</p>
                        <div className="mt-2 text-xs text-gray-500">Book ID: {book.book_id}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="font-semibold text-gray-900">{formatCurrency(book.price)}</div>
                        <div className="text-sm text-gray-500 mt-1">Subtotal: {formatCurrency((book.price || 0) * (book.quantity || 1))}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center border rounded-md px-2 py-1">
                        <button
                          className="px-3 text-gray-600"
                          onClick={() => updateQuantity(book, Math.max(1, Number(book.quantity || 1) - 1))}
                          disabled={savingId === book.book_id}
                        >
                          −
                        </button>
                        <input
                          className="w-16 text-center border-l border-r px-1 text-sm"
                          type="number"
                          min="1"
                          value={book.quantity}
                          onChange={(e) => handleQtyInput(book, e.target.value)}
                          onBlur={() => updateQuantity(book, Number(book.quantity || 1))}
                        />
                        <button
                          className="px-3 text-gray-600"
                          onClick={() => updateQuantity(book, Number(book.quantity || 1) + 1)}
                          disabled={savingId === book.book_id}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => deleteCart(book)}
                        className="ml-auto inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                      >
                        Remove
                      </button>

                      {/* <button
                        onClick={() => navigate(`/book/${book.book_id}`)}
                        className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                      >
                        View
                      </button> */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="bg-white p-5 rounded-xl shadow-sm h-fit">
            <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Items</span>
                <span>{carts.reduce((acc, it) => acc + Number(it.quantity || 1), 0)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>

              <div className="mt-4">
                <button
                  onClick={buyAll}
                  disabled={buying}
                  className={`w-full py-3 rounded-md text-white font-semibold ${buying ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {buying ? "Processing…" : "Checkout"}
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Need help? <button onClick={() => navigate("/contact")} className="text-blue-600 hover:underline">Contact support</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
