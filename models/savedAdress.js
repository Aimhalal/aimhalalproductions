import mongoose from "mongoose";

const savedAdress = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
    address: [
      {
        latitude: Number,
        longitude: Number,
        street: String,
        apartment: String,
        floor: String,
        label: String,
        complete_location: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("savedAdress", savedAdress);
