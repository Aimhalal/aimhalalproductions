import mongoose from "mongoose";

const favourite = new mongoose.Schema(
  {
    item: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    type: {
      type: String,
      default: "product",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("favourite", favourite);
