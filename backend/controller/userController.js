const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const safe = require("../utils/safe");
require("dotenv").config();
const { JWT_KEY } = process.env;

//! USER REGISTER HANDLER
exports.userRegister = async (req, res) => {
  const username = safe.sanitizeString(req.body.username || "", 100);
  const useremail = safe.sanitizeString(req.body.useremail || req.body.email || "", 100);
  const userpassword = (req.body.userpassword || req.body.password || "").toString();

  if (!username || !useremail || !userpassword || userpassword.length < 6) {
    return res.status(400).json({ success: false, message: "Please provide valid username, email and password (min 6 chars)" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE useremail = ?", [useremail]);
    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userpassword, salt);

    await db.query("INSERT INTO users (username, useremail, userpassword) VALUES (?, ?, ?)", [username, useremail, hashedPassword]);

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//! USER LOGIN
exports.userLogin = async (req, res) => {
  const useremail = safe.sanitizeString(req.body.useremail || req.body.email || "", 100);
  const userpassword = (req.body.userpassword || req.body.password || "").toString();

  if (!useremail || !userpassword) {
    return res.status(400).json({ message: "Please provide both email and password" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE useremail = ?", [useremail]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(userpassword, user.userpassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.userId }, JWT_KEY, { expiresIn: "1h" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      username: user.username,
      userId: user.userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
