import mongoose from "mongoose";

const newsletter = new mongoose.Schema(
  {
    email: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("newsletter", newsletter);
