import mongoose from "mongoose";

const ingredientList = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const IngredientList = mongoose.model("IngredientList", ingredientList);
