import express from "express";
import authentication from "../middlewares/authentication.js";
import { payByCard } from "../controllers/payByCard.js";
const router = express.Router();

router.post("/", authentication.verifyAuthToken, payByCard);

export default router;
