import express from "express";
import authentication from "../middlewares/authentication.js";
import { updateMain } from "../controllers/prayerTime.js";
const router = express.Router();

router.post("/", updateMain);
router.post("/getPrayer-now", async (req, res) => {
  const { userId } = req.body;
  const timing = await PrayerTime.findById({
    _id: userId,
  });

  return res.status(200).json(timing);
});

export default router;
