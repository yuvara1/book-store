const db = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { JWT_KEY } = process.env;

const resolveUserId = (req) => {
  // explicit places first
  if (req.body?.userId) return req.body.userId;
  if (req.body?.user_id) return req.body.user_id;
  if (req.params?.user_id) return req.params.user_id;
  if (req.query?.userId) return req.query.userId;
  if (req.query?.user_id) return req.query.user_id;
  if (req.user && req.user.userId) return req.user.userId;

  // try Authorization: Bearer <token>
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      const token = parts[1];
      try {
        if (JWT_KEY) {
          const decoded = jwt.verify(token, JWT_KEY);
          if (decoded && decoded.userId) return decoded.userId;
        } else {
          // fallback decode without verification (use only if you understand the risks)
          const decoded = jwt.decode(token);
          if (decoded && decoded.userId) return decoded.userId;
        }
      } catch (err) {
        // invalid token -> no user
        return null;
      }
    }
  }

  return null;
};


/**
 * Buy a single book (Buy Now)
 * Body: { bookId, quantity = 1, userId }
 */
exports.buyNow = async (req, res) => {
  const userId = resolveUserId(req);
  const bookId = req.body.bookId || req.body.book_id;
  const quantity = Number(req.body.quantity || 1);

  if (!userId) return res.status(400).json({ success: false, message: "Missing userId 3" });
  if (!bookId || quantity <= 0) {
    return res.status(400).json({ success: false, message: "Missing bookId or invalid quantity" });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [[book]] = await conn.query("SELECT * FROM books WHERE bookId = ?", [bookId]);
    if (!book) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    if (book.stock < quantity) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }

    await conn.query("UPDATE books SET stock = stock - ? WHERE bookId = ?", [quantity, bookId]);
    await conn.query("DELETE FROM cart WHERE user_id = ? AND book_id = ?", [userId, bookId]);

    try {
      const total = Number(book.price) * quantity;
      const [r] = await conn.query("INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, NOW())", [userId, total]);
      const orderId = r.insertId;
      await conn.query("INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, bookId, quantity, book.price]);
    } catch (err) {
      // ignore if orders tables don't exist
    }

    await conn.commit();
    return res.status(200).json({ success: true, message: "Purchase successful", total: Number(book.price) * quantity });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("buyNow error:", error);
    return res.status(500).json({ success: false, message: "Purchase failed" });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Buy everything in the user's cart
 * Body: { userId }
 */
exports.buyCart = async (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(400).json({ success: false, message: "Missing userId 4" });

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT c.book_id, c.quantity, b.price, b.stock
       FROM cart c
       JOIN books b ON c.book_id = b.bookId
       WHERE c.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    for (const item of rows) {
      if (item.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for book ${item.book_id}` });
      }
    }

    let total = 0;
    for (const item of rows) {
      await conn.query("UPDATE books SET stock = stock - ? WHERE bookId = ?", [item.quantity, item.book_id]);
      total += Number(item.price) * Number(item.quantity);
    }

    await conn.query("DELETE FROM cart WHERE user_id = ?", [userId]);

    try {
      const [r] = await conn.query("INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, NOW())", [userId, total]);
      const orderId = r.insertId;
      for (const item of rows) {
        await conn.query("INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, item.book_id, item.quantity, item.price]);
      }
    } catch (err) {
      // ignore if orders tables don't exist
    }

    await conn.commit();
    return res.status(200).json({ success: true, message: "Purchase successful", total });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("buyCart error:", error);
    return res.status(500).json({ success: false, message: "Purchase failed" });
  } finally {
    if (conn) conn.release();
  }
};