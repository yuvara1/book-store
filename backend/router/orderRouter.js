const { Router } = require("express");
const { buyNow, buyCart, orderHistory } = require("../controller/orderController");
const auth = require("../auth/auth");
const router = Router();

// buy endpoints (accept token or userId)
router.post("/buy-now", buyNow);
router.post("/buy-cart", buyCart);

// protected endpoint for viewing user's order history
router.get("/history", auth.protected, orderHistory);

module.exports = router;