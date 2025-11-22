const CartItem = ({ item, deleteCart }) => {
  return (
    <div className="cartItem p-2.5 w-full md:w-[300px] flex border rounded-lg shadow-md m-2.5">
      <div className="cartImg w-[120px] flex-shrink-0">
        <img
          src={item.bookImage}
          alt={item.title}
          className="w-full h-auto rounded-md object-cover"
        />
      </div>
      <div className="cartDetails relative ml-3 flex-1">
        <h1 className="font-semibold text-lg">{item.title}</h1>
        <p className="text-sm text-gray-600">by {item.author}</p>
        <p className="text-sm font-medium mt-1">Price: ₹{item.price}</p>
        <div className="absolute bottom-0 w-full">
          <button
            onClick={() => {
              deleteCart(item);
            }}
            className="bg-red-600 w-full rounded-md text-white py-1.5 mt-2 hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
export default CartItem;
