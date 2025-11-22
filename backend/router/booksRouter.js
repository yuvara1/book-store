const express = require("express");
const {
  getBooks,
  addBooks,
  getBookByTitle,
  getBooksByAuthor,
} = require("../controller/booksController");
const db = require("../config/db");

const router = express.Router();

router.get("/", getBooks);
router.post("/", addBooks);
router.get("/title/:title", getBookByTitle);
router.get("/author/:author", getBooksByAuthor);

module.exports = router;
