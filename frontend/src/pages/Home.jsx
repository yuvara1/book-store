import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BooksCard from "../components/BooksCard";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // guard useAuth()
  const user = auth?.user || null;
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const userIdStored = user?.userId || JSON.parse(localStorage.getItem("user"))?.userId;
  const isAuthenticated = auth?.isAuthenticated || Boolean(token);

  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTitle, setSerachTitle] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");

  //!FETCHING BOOKS--------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // ensure axios has Authorization header so backend can resolve userId from token
    if (token && !axios.defaults.headers.common.Authorization) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    const fetchBooks = async () => {
      try {
        let res = await axios.get("http://localhost:3000/bookstore/api/books");
        setBooks(res.data.books || []);

        // include userId as query fallback if token not working
        const cartUrl = userIdStored
          ? `http://localhost:3000/bookstore/api/cart?userId=${userIdStored}`
          : "http://localhost:3000/bookstore/api/cart";
        let getCart = await axios.get(cartUrl);
        setCart(getCart.data.rows || []);
      } catch (error) {
        alert(error.response?.data?.message || "Failed to fetch");
      }
    };
    fetchBooks();
  }, [navigate, isAuthenticated, token, userIdStored]);

  //!ADDING BOOKS TO CART----------------------------------------------------------------------
  const handleCart = async (book) => {
    try {
      const tokenLocal = token || (JSON.parse(localStorage.getItem("user")) || {}).token;
      if (!tokenLocal) {
        navigate("/login");
        return;
      }
      if (!axios.defaults.headers.common.Authorization) {
        axios.defaults.headers.common.Authorization = `Bearer ${tokenLocal}`;
      }

      const userIdToSend = user?.userId || JSON.parse(localStorage.getItem("user"))?.userId;
      const payload = { bookId: book.bookId };
      if (userIdToSend) payload.userId = userIdToSend;

      let res = await axios.post("http://localhost:3000/bookstore/api/cart", payload);
      alert(res.data.message || "Added to cart");
      // refresh cart list (pass userId query if available)
      const cartUrl = userIdToSend
        ? `http://localhost:3000/bookstore/api/cart?userId=${userIdToSend}`
        : "http://localhost:3000/bookstore/api/cart";
      let getCart = await axios.get(cartUrl);
      setCart(getCart.data.rows || []);
      // notify other components
      try { window.dispatchEvent(new Event("cartUpdated")); } catch (e) {}
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      else alert(error.response?.data?.message || "Add to cart failed");
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center p-4 bg-gray-100 shadow-md">
        <Header cart={cart} setSerachTitle={setSerachTitle} setSearchAuthor={setSearchAuthor} />
      </header>
      <main>
        <div className="cardContainer flex flex-wrap ">
          {books
            .filter((book) => book.title.toLowerCase().includes(searchTitle.toLowerCase()))
            .filter((book) => book.author.toLowerCase().includes(searchAuthor.toLowerCase()))
            .map((book) => {
              return <BooksCard key={book.bookId} book={book} handleCart={handleCart} />;
            })}
        </div>
      </main>
    </div>
  );
};

export default Home;
