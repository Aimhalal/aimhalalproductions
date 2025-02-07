import express from "express";
const router = express.Router();
import rider from "../controllers/rider.js";
import authentication from "../middlewares/authentication.js";

router.post("/", rider.store);
router.post("/login", rider.login);
router.post("/vehicle", authentication.verifyRiderAuth, rider.addVehicle);
router.put(
  "/deleteVehicle/:id",
  authentication.verifyRiderAuth,
  rider.deleteVehicle
);
router.put("/updateRider", authentication.verifyRiderAuth, rider.updateRider);
router.get("/nearbyOrders", authentication.verifyRiderAuth, rider.nearbyOrders);

export default router;
