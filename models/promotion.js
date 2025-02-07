import mongoose, { Mongoose } from "mongoose";
const promotion = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "product",
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    banner: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now(),
    },
    endDate: {
      type: Date,
      default: Date.now(),
    },
    delivery_type: {
      type: String,
      default: "delivery",
    },
    delivery_types: {
      type: Array,
      default: [],
    },
    store: {
      type: mongoose.Types.ObjectId,
      ref: "store",
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  { timestamps: true }
);

promotion.index({ location: "2dsphere" });

export default mongoose.model("promotion", promotion);
