var mongoose = require("mongoose");

var Order = mongoose.model("Order", {
  startLat: String,
  startLng: Number,
  endLat: String,
  endLng: String,
  status: String,
  distance: Number
});

module.exports = Order;
