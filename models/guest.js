import mongoose from "mongoose";

const guest = new mongoose.Schema(
  {
    device_id: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("guest", guest);
