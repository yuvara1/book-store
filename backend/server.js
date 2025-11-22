const express = require("express");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const db = require("./config/db");
const schema = require("./model/schema");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/bookstore/api/user", require("./router/userRouter"));
app.use("/bookstore/api/books", require("./router/booksRouter"));
app.use("/bookstore/api/cart", require("./router/cartRouter"));
app.use("/bookstore/api/order", require("./router/orderRouter")); // <-- added

app.listen(PORT, (err) => {
  if (err) throw err;
  console.log("server is running on port:", PORT);
});
