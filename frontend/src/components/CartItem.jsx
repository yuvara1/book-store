import React from "react";

const CartItem = ({ item, deleteCart }) => {
  const formatCurrency = (v) => `₹${Number(v || 0).toFixed(2)}`;
  const img = item.bookImage || item.book_image || "https://via.placeholder.com/160x220?text=No+Image";
  const inStock = Number(item.stock || item.stock_count || 0) > 0;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white rounded-xl shadow-md hover:shadow-lg transition p-4">
      <div className="w-full md:w-32 flex-shrink-0 relative">
        <img
          src={img}
          alt={item.title || "book"}
          className="w-full h-40 md:h-32 object-cover rounded-lg"
        />
        <span
          className={
            "absolute top-2 left-2 text-xs px-2 py-0.5 rounded " +
            (inStock ? "bg-green-600 text-white" : "bg-red-600 text-white")
          }
        >
          {inStock ? "In stock" :""}
        </span>
      </div>

      <div className="flex-1 w-full">
        <div className="flex justify-between items-start">
          <div className="pr-4">
            <h1 className="text-lg font-semibold text-gray-800 line-clamp-2">{item.title}</h1>
            <p className="text-sm text-gray-500 mt-1">by {item.author || item.username || "Unknown"}</p>
            {item.isbn && <p className="text-xs text-gray-400 mt-1">ISBN: {item.isbn}</p>}
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Price</div>
            <div className="text-lg font-semibold text-gray-800">{formatCurrency(item.price)}</div>
            <div className="text-xs text-gray-400 mt-1">Subtotal: {formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 bg-gray-50 border rounded-md px-3 py-1">
            <div className="text-sm text-gray-600">Qty</div>
            <div className="w-12 text-center font-medium text-gray-800">{item.quantity || 1}</div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => deleteCart(item)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 transition text-sm"
              aria-label="Remove from cart"
            >
              🗑️
              <span className="hidden sm:inline">Remove</span>
            </button>

            {/* <button
              type="button"
              className="px-3 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              View
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
