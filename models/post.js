import mongoose from "mongoose";

const post = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    post_type: {
      type: String,
      default: "event",
    },
    date: {
      type: Date,
      default: Date.now(),
    },
    endDate: {
      type: Date,
    },

    location: {
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

    price: {
      type: Number,
      default: 0,
    },
    contactNumber: {
      type: String,
      default: "",
    },
    contactPerson: {
      type: String,
      default: "",
    },

    paid: {
      type: Boolean,
      default: false,
    },
    time: {
      type: String,
      default: "",
    },
    endtime: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: "posts/no-image.png",
    },
    isArchive: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null,
    },

    isRegistrationReq: {
      type: Boolean,
      default: false,
    },
    googleFormLink: {
      type: String,
      default: "",
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    conferanceLink: {
      type: String,
      default: "",
    },
    fullAddress: {
      type: String,
      default: "",
    },
    cover: {
      type: String,
      default: "posts/no-image.png",
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("post", post);
