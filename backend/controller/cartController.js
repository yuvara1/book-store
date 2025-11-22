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
        const decoded = JWT_KEY ? jwt.verify(token, JWT_KEY) : jwt.decode(token);
        if (!decoded) return null;
        // accept several common claim names
        return decoded.userId || decoded.user_id || decoded.id || decoded.sub || null;
      } catch (err) {
        // invalid token -> no user
        return null;
      }
    }
  }

  return null;
};

//!ADD TO CART
exports.addToCart = async (req, res) => {
  const userId = resolveUserId(req);
  const bookId = req.body.bookId || req.body.book_id;
  if (!userId) return res.status(400).json({ success: false, message: "Missing userId 1" });
  if (!bookId) return res.status(400).json({ success: false, message: "Missing bookId" });

  try {
   
    const [bookRows] = await db.query("SELECT * FROM books WHERE bookId = ?", [bookId]);
    if (bookRows.length === 0) {
      return res.status(404).json({ success: false, message: `Book with id ${bookId} not found` });
    }

    const [rows] = await db.query(
      "SELECT * FROM cart WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );

    if (rows.length > 0) {
      await db.query(
        "UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND book_id = ?",
        [userId, bookId]
      );
    } else {
      await db.query("INSERT INTO cart (user_id, book_id) VALUES (?, ?)", [userId, bookId]);
    }
    res.status(200).json({ success: true, message: "Added to cart" });
  } catch (error) {
    console.error("Cart error:", error);
    res.status(500).json({ success: false, message: "Cart operation failed" });
  }
};

//!GET CART
exports.getCartItem = async (req, res) => {
  console.log("request", req.body, req.query, !!req.headers?.authorization);

  const userId = resolveUserId(req);

  // If no userId, respond 401 with guidance (avoids ambiguous "Missing userId 2")
  if (!userId) {
    return res.status(401).json({
      success: false,
      message:
        "Unauthorized: missing userId. Provide Authorization: Bearer <token> or send ?userId=<id> (or userId in request body).",
    });
  }

  const sql = `SELECT u.username,b.title, b.price, b.bookImage, c.user_id,c.book_id, c.quantity 
               FROM users u 
               JOIN cart c ON u.userId = c.user_id 
               JOIN books b ON c.book_id = b.bookId 
               WHERE u.userId = ? `;
  try {
    const [rows] = await db.query(sql, [userId]);
    return res.status(200).json({ success: true, message: "Getting cart items", rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong", error });
  }
};

//!EDIT CART
exports.updateCart = async (req, res) => {
  const { user_id, book_id, quantity } = req.body;
  const userId = user_id || resolveUserId(req);
  if (!userId || !book_id || quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing user_id, book_id, or quantity",
    });
  }

  const sql = `UPDATE cart SET quantity = ? WHERE user_id =? AND book_id =?`;
  try {
    await db.query(sql, [quantity, userId, book_id]);
    return res.status(200).json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};

//!DELETE CART
exports.deleteCart = async (req, res) => {
  const user_id = req.params.user_id || req.body.userId;
  const book_id = req.params.book_id || req.body.bookId;
  if (!user_id || !book_id) {
    return res.status(400).json({ success: false, message: "Missing user_id or book_id" });
  }
  try {
    const sql = `DELETE FROM cart WHERE user_id = ? AND book_id = ?`;
    await db.query(sql, [user_id, book_id]);
    res.status(200).json({ success: true, message: "Cart item deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
