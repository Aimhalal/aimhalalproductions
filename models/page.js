import mongoose from "mongoose";

const page = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: "category/no-image.png",
    },
    status: {
      type: Boolean,
      default: false,
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
export default mongoose.model("page", page);
