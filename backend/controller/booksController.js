const db = require("../config/db");
const safe = require("../utils/safe");

//!ADD BOOK
exports.addBooks = async (req, res) => {
  try {
    const bookImage = safe.sanitizeString(req.body.bookImage || "", 300);
    const title = safe.sanitizeString(req.body.title || "", 200);
    const author = safe.sanitizeString(req.body.author || "", 150);
    const price = Number(req.body.price || 0);
    const stock = Number(req.body.stock || 0);

    if (!title || !author || !Number.isFinite(price) || Number(price) < 0 || !Number.isInteger(stock)) {
      return res.status(400).json({ success: false, message: "Invalid book data" });
    }

    const sql = `INSERT INTO books (bookImage,title,author,price,stock) VALUES (?,?,?,?,?) `;
    const [rows] = await db.query(`SELECT * FROM books WHERE title =?`, [title]);
    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: "book already exists" });
    }
    await db.query(sql, [bookImage, title, author, price, stock]);
    res.status(201).json({ success: true, message: "Book added successfully" });
  } catch (error) {
    console.error("Error inserting books:", error);
    res.status(500).json({ error: "Failed to insert books" });
  }
};

//!GET ALL BOOKS
exports.getBooks = async (req, res) => {
  try {
    const [books] = await db.query("SELECT * FROM books");
    res.status(200).json({ success: true, books });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//!GET BOOK BY TITLE
exports.getBookByTitle = async (req, res) => {
  const title = safe.sanitizeString(req.params.title || "", 200);
  try {
    const sql = `SELECT * FROM books WHERE title = ?`;
    const [rows] = await db.query(sql, [title]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "No book found" });
    }
    return res.status(200).json({ success: true, message: "Getting books by Title", rows });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};

//!GET BOOK BY AUTHER
exports.getBooksByAuthor = async (req, res) => {
  const author = safe.sanitizeString(req.params.author || "", 150);
  try {
    const sql = `SELECT * FROM books WHERE author = ? `;
    const [rows] = await db.query(sql, [author]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "No book found" });
    }
    return res.status(200).json({ success: true, message: "Getting books by Author", rows });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};

//!UPDATING BOOK
exports.editBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { bookImage, title, author, price, stock } = req.body;

    const [result] = await db.query(
      `UPDATE books SET bookImage = ?, title = ?, author = ?, price = ?, stock = ? WHERE bookId = ?`,
      [bookImage, title, author, price, stock, bookId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Book updated successfully" });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ success: false, error: "Failed to update book" });
  }
};
