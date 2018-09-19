const express = require("express");
const order = require("./order");
const router = new express.Router();

router.route("/order").post(order.placeOrder);
router.route("/order/:id").put(order.takeOrder);
router.route("/order").get(order.listOrders);

module.exports = router;
