import mongoose from "mongoose";

const card = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "office",
    },
    street: {
      type: String,
      default: "-",
    },
    appartment: {
      type: String,
      unique: "-",
    },
    floor: {
      type: Number,
      unique: true,
    },
    expiry_date: {
      type: Date,
    },
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
export default mongoose.model("card", card);
