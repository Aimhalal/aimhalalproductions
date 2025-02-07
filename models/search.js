import mongoose from "mongoose";

const search = new mongoose.Schema(
  {
    keyword: { type: String, required: true },
    user: {
      type: mongoose.Types.ObjectId,
      default: null,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("search", search);
