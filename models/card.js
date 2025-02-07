import mongoose from "mongoose";

const card = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    number: {
      type: Number,
      unique: true,
    },
    cvc: {
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
