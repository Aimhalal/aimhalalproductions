import mongoose from "mongoose";

const inquiry = new mongoose.Schema(
  {
    subject: {
      type: String,
      default: "",
    },
    usertype: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    dial_code: {
      type: String,
      default: "",
    },
    phone_number: {
      type: String,
      default: 0,
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("inquiry", inquiry);
