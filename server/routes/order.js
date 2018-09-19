const Order = require("../models/Order");
const config = require("../config");
const googleMapsClient = require("@google/maps").createClient({
  key: config.googleApiKey,
  Promise: Promise
});

const orderApi = {
  placeOrder: async function(req, res) {
    const { origin, destination } = req.body;
    // If the input is not provided then send error
    if (!origin || !destination) {
      return res.status(400).send({ error: "Missing required parameters" });
    }

    const [startLat, startLong] = origin;
    const [endLat, endLong] = destination;
    // If the input is not provided then send error
    if (!startLat || !startLong || !endLat || !endLong) {
      return res.status(400).send({ error: "Missing required parameters" });
    }

    let response;
    // Get distance from google API
    try {
      response = await googleMapsClient
        .distanceMatrix({
          origins: [{ lat: startLat, lng: startLong }],
          destinations: [{ lat: endLat, lng: endLong }]
        })
        .asPromise();
    } catch (err) {
      res.status(500);
      return res.send({ error: err.message });
    }

    const result = response.json;
    const resultElement = result.rows[0].elements[0];

    if (resultElement.status === "OK") {
      // Prepare order document
      const order = new Order({
        startLat: startLat,
        startLng: startLong,
        endLat: endLat,
        endLng: endLong,
        status: "UNASSIGN",
        distance: result.rows[0].elements[0].distance.value
      });
      //Save order in database
      try {
        const data = await order.save();
        res.json({
          id: data._id,
          distance: data.distance,
          status: data.status
        });
      } catch (err) {
        res.status(500);
        return res.send({ error: "Could not able to save order." });
      }
    } else {
      res.status(500);
      res.send({ error: "Not able to find the path" });
    }
  },
  takeOrder: async function(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    let data;
    const statusParam = status && status === "taken" ? status : false;

    if (!id || !statusParam) {
      return res.status(400).send({ error: "Missing required parameters" });
    }

    let data;
    try {
      data = await Order.findById(id);
    } catch (err) {
      res.status(500);
      return res.send({ error: err.message });
    }

    if (data) {
      //If order is unassigned then only return order in response;
      if (data.status === "UNASSIGN") {
        // Update order with status to 'TAKEN'
        data.status = "TAKEN";
        try {
          const saveData = await data.save();
          return res.json({ status: "SUCCESS" });
        } catch (err) {
          res.status(500);
          return res.send({ error: err.message });
        }
      } else {
        res.status(409);
        return res.send({ error: "ORDER_ALREADY_BEEN_TAKEN" });
      }
    } else {
      res.status(400);
      return res.send({ error: "No order found for id: " + id });
    }
  },
  listOrders: function(req, res) {
    const { page = 1, limit = 25 } = req.query;
    Order.find({})
      .skip(limit * (page - 1))
      .limit(Number(limit))
      .then(Orders => {
        const responseData = Orders.map(order => ({ id: order._id, distance: order.distance, status: order.status }));
        res.json(responseData);
      })
      .catch(err => {
        res.status(500);
        res.send({ error: err.message });
      });
  }
};

module.exports = orderApi;
