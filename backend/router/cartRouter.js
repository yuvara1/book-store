const { Router } = require("express");
const {
  addToCart,
  getCartItem,
  updateCart,
  deleteCart,
} = require("../controller/cartController");
const router = Router();

// NOTE: removed protected middleware so API works without Authorization header
//!ADD TO CART
router.post("/", addToCart);
// get cart by userId query: /cart?userId=123
router.get("/", getCartItem);
router.put("/", updateCart);
router.delete("/:user_id/:book_id", deleteCart);
module.exports = router;
