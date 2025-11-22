const db = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { JWT_KEY } = process.env;
exports.protected = async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.status(401).json({ success: false, message: "User is not authorized" });
  }

  try {
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jwt.verify(token, JWT_KEY);
    let { userId } = decoded;
    const [rows] = await db.query(`SELECT * FROM users WHERE userId =?`, [userId]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "User is not found" });
    }
    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "User is not authorized" });
  }
};
