import mongoose from "mongoose";

const incredients = new mongoose.Schema(
  {
    item: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("incredient", incredients);
