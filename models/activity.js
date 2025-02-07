import mongoose from "mongoose";

const activity = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Types.ObjectId,
      default: "office",
    },
    action: {
      type: String,
      default: "",
    },
    resource: {
      type: String,
      unique: "-",
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("activity", activity);
