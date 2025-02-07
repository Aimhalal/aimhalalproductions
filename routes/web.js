import express from "express";
import web from "../controllers/web.js";
import store from "../controllers/store.js";
const router = express.Router();

router.post("/inquiry", web.store);
router.post("/news-letter", web.newsLetter);
router.get("/promotions", web.promotions);

router.get("/store/:slug", store.getStoreById);

export default router;
