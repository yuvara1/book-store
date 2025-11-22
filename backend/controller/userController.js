const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_KEY } = process.env;
//! USER REGISTER HANDLER
exports.userRegister = async (req, res) => {
  console.log("Register request body:", req.body);
  // accept both shapes: { username, email, password } or { username, useremail, userpassword }
  const username = req.body.username;
  const useremail = req.body.useremail || req.body.email;
  const userpassword = req.body.userpassword || req.body.password;

  if (!username || !useremail || !userpassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide all fields (username, email, password)",
    });
  }
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE useremail = ?", [
      useremail,
    ]);
    if (rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    //! Hash the password-----------------------------------------------------------
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userpassword, salt);

    //! Insert user into database
    await db.query(
      "INSERT INTO users (username, useremail, userpassword) VALUES (?, ?, ?)",
      [username, useremail, hashedPassword]
    );

    res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
//! USER REGISTER HANDLER
exports.userLogin = async (req, res) => {
  // accept both shapes: { useremail, userpassword } or { email, password }
  const useremail = req.body.useremail || req.body.email;
  const userpassword = req.body.userpassword || req.body.password;

  if (!useremail || !userpassword) {
    return res
      .status(400)
      .json({ message: "Please provide both email and password" });
  }

  try {
    // ensure correct table name 'users'
    const [rows] = await db.query("SELECT * FROM users WHERE useremail = ?", [
      useremail,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = rows[0];
    //! Compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(userpassword, user.userpassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    req.user = user;
    const token = jwt.sign({ userId: user.userId }, JWT_KEY, {
      expiresIn: "1h",
    });

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
