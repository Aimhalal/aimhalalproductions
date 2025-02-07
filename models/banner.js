import mongoose from "mongoose";

const banner = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "homepage",
    },
    banner: {
      type: String,
      default: "",
    },
    mobile_banner: {
      type: String,
      default: "",
    },
    store: {
      type: mongoose.Types.ObjectId,
      ref: "store",
      default: null,
    },
    promotion: {
      type: mongoose.Types.ObjectId,
      ref: "promotion",
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    isArchive: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("banner", banner);
