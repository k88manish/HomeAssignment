//During test the env variable is set to test
process.env.NODE_ENV = "test";
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("./server");
let should = chai.should();
chai.use(chaiHttp);

describe("Order API testing", () => {
  const orderId = describe("/POST Order", () => {
    it("It should save order and when give correct latitude / longitude", done => {
      let payload = {
        origin: [55.930385, -3.118425],
        destination: [50.087692, 14.42115]
      };
      chai
        .request(server)
        .post("/order")
        .send(payload)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("status");
          res.body.status.should.be.equal("UNASSIGN");
          res.body.should.have.property("id");
          done();
        });
    });

    it("it should not be able to give distance when given invalid lat/long", done => {
      let payload = {
        origin: [75.930385, -3.118425],
        destination: [50.087692, 14.42115]
      };
      chai
        .request(server)
        .post("/order")
        .send(payload)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          res.body.error.should.be.equal("Not able to find the path");
          done();
        });
    });
  });

  describe("/PUT Order", () => {
    it("It should update order status to 'taken'", done => {
      let payload = {
        origin: [55.930385, -3.118425],
        destination: [50.087692, 14.42115]
      };
      chai
        .request(server)
        .post("/order")
        .send(payload)
        .end((err, orderRes) => {
          const orderId = orderRes.body.id;
          let payload = {
            status: "taken"
          };
          chai
            .request(server)
            .put("/order/" + orderId)
            .send(payload)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              res.body.should.have.property("status");
              res.body.status.should.be.equal("SUCCESS");
              done();

              describe("Order PUT", () => {
                it("If order is already taken is should give error", done => {
                  let payload = {
                    status: "taken"
                  };
                  console.log(orderId);
                  chai
                    .request(server)
                    .put("/order/" + orderId)
                    .send(payload)
                    .end((err, res) => {
                      res.should.have.status(409);
                      res.body.should.be.a("object");
                      res.body.should.have.property("error");
                      res.body.error.should.be.equal("ORDER_ALREADY_BEEN_TAKEN");
                      done();
                    });
                });
              });
            });
        });
    });
  });
});
