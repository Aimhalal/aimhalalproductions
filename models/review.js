import mongoose, { Mongoose, mongo } from "mongoose";

const reviews = new mongoose.Schema(
  {
    Order: {
      type: mongoose.Types.ObjectId,
      ref: "orders",
      default: null,
    },
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null,
    },
    item: {
      type: mongoose.Types.ObjectId,
      ref: "product",
      default: null,
    },

    rating: {
      type: Number,
      default: 0,
    },
    store: {
      type: mongoose.Types.ObjectId,
      ref: "store",
      default: null,
    },
    message: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "products",
    },
  },
  {
    timestamps: true,
  }
);

reviews.index({
  item: 1,
});
export default mongoose.model("reviews", reviews);
