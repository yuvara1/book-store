const { Router } = require("express");
const { buyNow, buyCart } = require("../controller/orderController");
const router = Router();

// NOTE: removed protected middleware so buy APIs can be called without Authorization
router.post("/buy-now", buyNow);
router.post("/buy-cart", buyCart);

module.exports = router;