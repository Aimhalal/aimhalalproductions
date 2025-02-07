import mongoose from "mongoose";

const faq = new mongoose.Schema(
  {
    question: {
      type: String,
    },
    answer: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("faq", faq);
