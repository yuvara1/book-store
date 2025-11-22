import React, { useEffect, useState } from "react";
import Dash_Card from "../components/Dash_Card";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Dashboard = () => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get("http://localhost:3000/bookstore/api/books");
        setBooks(res.data.books || []);
      } catch (err) {
        // ignore fetch errors
      }
    };
    fetchBooks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg overflow-hidden mb-8">
          <img src="/images/dash-banner.jpg" alt="banner" className="w-full h-44 md:h-72 object-cover rounded" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-red-600 mb-8">Popular Books</h1>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <Dash_Card key={book.bookId} book={book} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
