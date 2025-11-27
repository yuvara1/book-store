import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const auth = useAuth();
  const navigate = useNavigate();

  // new: track which order is being reordered
  const [reordering, setReordering] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:3000/bookstore/api/order/history");
        setOrders(res.data.orders || []);
      } catch (err) {
        if (err.response?.status === 401) {
          auth?.logout?.();
          navigate("/login");
        } else {
          console.error("Failed to load orders:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, auth]);

  // add reorder function: post items to cart, fetch updated cart, dispatch update and navigate with cart state
  const reorder = async (order) => {
    const userId = auth?.user?.userId || JSON.parse(localStorage.getItem("user"))?.userId;
    const token = auth?.user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!userId) { navigate("/login"); return; }

    if (token && !axios.defaults.headers.common?.Authorization) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    if (!order.items || order.items.length === 0) {
      alert("Nothing to reorder for this order.");
      return;
    }

    setReordering(order.id);
    try {
      // add each item to cart (concurrent). backend should handle duplicates/quantity merges.
      const posts = order.items.map((it) => {
        const bookId = it.bookId || it.book_id || it.id;
        return axios.post("http://localhost:3000/bookstore/api/cart", { bookId, userId });
      });
      await Promise.all(posts);

      // fetch latest cart for this user and pass to Cart page so it can show immediately
      const cartRes = await axios.get(`http://localhost:3000/bookstore/api/cart?userId=${userId}`);
      const cartRows = cartRes.data.rows || [];

      // notify other components (header badges etc.)
      try { window.dispatchEvent(new Event("cartUpdated")); } catch (e) {}

      // navigate to cart with refreshed cart list
      navigate("/cart", { state: cartRows });
    } catch (err) {
      console.error("Reorder error:", err);
      alert(err?.response?.data?.message || "Failed to add items to cart");
    } finally {
      setReordering(null);
    }
  };

  const toggleRaw = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }));
  const formatCurrency = (v) => `₹${Number(v || 0).toFixed(2)}`;
  const filtered = orders.filter((o) => {
    if (!query) return true;
    const q = query.toString().toLowerCase();
    return (
      String(o.id).toLowerCase().includes(q) ||
      (o.items || []).some((it) =>
        ((it.title || "") + " " + (it.author || "")).toLowerCase().includes(q)
      )
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return <div className="p-6 text-center">Loading orders…</div>;
  if (!orders.length) return <div className="container mx-auto p-6 text-center">No orders found.</div>;

  return (
    <div className="container mx-auto p-6">
      {/* hide header search inputs on this page */}
      <Header cart={[]} showSearch={false} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Order History</h1>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by order id, book title or author"
            className="px-3 py-2 border rounded-md w-full md:w-80"
          />
          <div className="text-sm text-gray-600">Showing {filtered.length} result(s)</div>
        </div>
      </div>

      <div className="space-y-6">
        {pageItems.map((order) => {
          const created = order.created_at ? new Date(order.created_at).toLocaleString() : "—";
          const total = Number(order.total || 0).toFixed(2);
          const status = order.raw?.status || "Completed";
          return (
            <div key={order.id} className="bg-white p-4 rounded shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 text-xs rounded-full ${status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {status}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{created}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold">Total: {formatCurrency(total)}</div>
                  <div className="text-sm text-gray-600">{order.items?.length || 0} item(s)</div>
                  <button onClick={() => toggleRaw(order.id)} className="px-3 py-1 border rounded text-sm">
                    {expanded[order.id] ? "Hide details" : "View details"}
                  </button>

                  <button
                    onClick={() => reorder(order)}
                    disabled={reordering === order.id}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {reordering === order.id ? "Adding…" : "Reorder"}
                  </button>
                </div>
              </div>

              {expanded[order.id] && (
                <div className="mt-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-sm text-gray-600 border-b">
                        <tr>
                          <th className="py-2">Cover</th>
                          <th className="py-2">Title & Info</th>
                          <th className="py-2 text-right">Price</th>
                          <th className="py-2 text-right">Qty</th>
                          <th className="py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.items || []).map((it, idx) => {
                          const qty = Number(it.quantity || 1);
                          const price = Number(it.price || 0);
                          const subtotal = (qty * price).toFixed(2);
                          return (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="py-3 w-20">
                                <img src={it.bookImage || it.book_image || "https://via.placeholder.com/80x100?text=No+Image"} alt={it.title} className="w-16 h-20 object-cover rounded"/>
                              </td>
                              <td className="py-3">
                                <div className="font-medium">{it.title || `Book ${it.book_id}`}</div>
                                <div className="text-sm text-gray-500">by {it.author || "Unknown"}</div>
                                <div className="text-xs text-gray-400">Book ID: {it.book_id}</div>
                              </td>
                              <td className="py-3 text-right">{formatCurrency(price)}</td>
                              <td className="py-3 text-right">{qty}</td>
                              <td className="py-3 text-right font-semibold">₹{subtotal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4" className="pt-3 text-right font-semibold">Order Total:</td>
                          <td className="pt-3 text-right font-semibold">{formatCurrency(order.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* pagination */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">Prev</button>
        <div className="text-sm text-gray-700">Page {page} of {totalPages}</div>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded">Next</button>
      </div>
    </div>
  );
};

export default OrderHistory;