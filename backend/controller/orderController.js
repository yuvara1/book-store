const db = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { JWT_KEY } = process.env;
const safe = require("../utils/safe");

const resolveUserId = (req) => {
  const cand =
    req.body?.userId ??
    req.body?.user_id ??
    req.params?.user_id ??
    req.query?.userId ??
    req.query?.user_id;

  if (cand !== undefined && cand !== null) {
    const n = safe.toPositiveInt(cand);
    if (n) return n;
  }

  if (req.user && req.user.userId) {
    const n = safe.toPositiveInt(req.user.userId);
    if (n) return n;
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      const token = parts[1];
      try {
        const decoded = JWT_KEY ? jwt.verify(token, JWT_KEY) : jwt.decode(token);
        if (!decoded) return null;
        return safe.toPositiveInt(decoded.userId || decoded.user_id || decoded.id || decoded.sub);
      } catch (err) {
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
  const bookId = safe.toPositiveInt(req.body.bookId || req.body.book_id);
  const quantity = Number(req.body.quantity || 1);

  if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });
  if (!bookId || !Number.isFinite(quantity) || quantity <= 0) {
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
      // insert into total_price column (schema uses total_price)
      const [r] = await conn.query("INSERT INTO orders (user_id, total_price, created_at) VALUES (?, ?, NOW())", [userId, total]);
      const orderId = r.insertId;
      await conn.query("INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, bookId, quantity, book.price]);
    } catch (err) {
      // ignore if order related tables don't exist
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
  if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

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
      const [r] = await conn.query("INSERT INTO orders (user_id, total_price, created_at) VALUES (?, ?, NOW())", [userId, total]);
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

//! ORDER HISTORY
exports.orderHistory = async (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message:
        "Unauthorized: missing userId. Provide Authorization: Bearer <token> or send ?userId=<id> (or userId in request body).",
    });
  }

  try {
    const [orders] = await db.query(
      `SELECT id, user_id, total_price AS total, created_at, book_ids 
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    const enriched = [];
    for (const o of orders) {
      const orderId = o.id;
      let items = [];

      // 1) Try to get detailed items from order_items + books (explicit aliases)
      try {
        const [rows] = await db.query(
          `SELECT
             oi.book_id AS book_id,
             oi.quantity AS quantity,
             oi.price AS price,
             b.bookId AS bookId,
             b.title AS title,
             b.bookImage AS bookImage,
             b.author AS author
           FROM order_items oi
           LEFT JOIN books b ON oi.book_id = b.bookId
           WHERE oi.order_id = ?`,
          [orderId]
        );

        if (rows && rows.length) {
          items = rows.map((r) => ({
            book_id: r.book_id,
            bookId: r.bookId,
            title: r.title || null,
            bookImage: r.bookImage || r.book_image || null,
            author: r.author || null,
            quantity: r.quantity || 1,
            price: r.price || 0,
          }));
        }
      } catch (err) {
        // ignore if order_items table doesn't exist or query fails
        items = [];
      }

      // 2) Fallback: if no order_items rows, try reading book_ids JSON column and fetch books
      if ((!items || items.length === 0) && o.book_ids) {
        try {
          const parsed = typeof o.book_ids === "string" ? JSON.parse(o.book_ids) : o.book_ids;
          if (Array.isArray(parsed) && parsed.length > 0) {
            // ensure numeric ids
            const ids = safe.filterNumericIds(parsed.map((p) => (p && (p.bookId || p.id || p)) ));
            if (ids.length > 0) {
              const ph = safe.placeholders(ids);
              const [bookRows] = await db.query(
                `SELECT bookId, title, bookImage, author, price FROM books WHERE bookId IN (${ph})`,
                ids
              );
              items = bookRows.map((b) => {
                const found = parsed.find((p) => (p.bookId == b.bookId) || (p.id == b.bookId)) || {};
                return {
                  book_id: b.bookId,
                  bookId: b.bookId,
                  title: b.title,
                  bookImage: b.bookImage || b.book_image || null,
                  author: b.author || null,
                  quantity: found.quantity || found.qty || 1,
                  price: found.price || b.price || 0,
                };
              });
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      enriched.push({
        id: orderId,
        total: o.total || null,
        created_at: o.created_at || null,
        items,
        raw: o,
      });
    }

    return res.status(200).json({ success: true, orders: enriched });
  } catch (error) {
    console.error("orderHistory error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch order history" });
  }
};