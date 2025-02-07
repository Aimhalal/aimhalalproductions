import mongoose from "mongoose";

const riderVehicle = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Types.ObjectId,
      ref: "riders",
    },
    vehiclename: {
      type: String,
      default: "",
    },
    vehiclenumber: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: "vehicle/no-image.png",
    },
    license: {
      type: String,
      default: "vehicle/no-image.png",
    },
    document: {
      type: String,
      default: "vehicle/no-image.png",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("riderVehicle", riderVehicle);
