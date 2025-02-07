import mongoose from "mongoose";

const storeCategory = new mongoose.Schema(
  {
    name: { type: String, required: true },
    parent: {
      type: mongoose.Types.ObjectId,
      default: null,
      ref: "storeCategory",
    },
    group: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: "category/no-image.png",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("storeCategory", storeCategory);
