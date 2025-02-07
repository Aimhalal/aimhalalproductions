import mongoose from "mongoose";

const riders = new mongoose.Schema(
  {
    fullname: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
    },
    vehicle: [
      {
        type: mongoose.Types.ObjectId,
        ref: "riderVehicle",
      },
    ],
    approval: {
      type: String,
      default: "pending",
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: mongoose.Types.ObjectId,
      ref: "roles",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "pending",
    },
    verificationToken: {
      type: String,
      default: "",
    },
    fcmToken: {
      type: String,
      default: "",
    },
    deviceId: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "ar",
    },
    socket: {
      type: String,
      default: "",
    },
    longitude: {
      type: Number,
      default: 0,
    },
    latitude: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("riders", riders);
