import express from "express";
import {
  updateIngredientList,
  getIngredientList,
  multipleIngredientList,
  delIngredients,
} from "../controllers/ingredientList.js";
const router = express.Router();

router.post("/upload", updateIngredientList);
router.get("/", getIngredientList);
router.post("/multiples", multipleIngredientList);
router.delete("/del", delIngredients);
// router.get('/order/:id',role.store);

export default router;
