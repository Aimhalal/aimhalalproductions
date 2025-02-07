import mongoose from "mongoose";

const store = new mongoose.Schema(
  {
    store_name: {
      type: String,
      default: "",
    },

    aboutus: {
      type: String,
      default: "",
    },

    types: [
      {
        type: String,
      },
    ],
    default_code: {
      type: String,
      default: "",
    },
    store_url: {
      type: String,
      default: "",
    },
    opening_hours: [
      {
        day: { type: String },
        startTime: { type: String, default: "" },
        endTime: { type: String, default: "" },
        on: { type: Boolean, default: false },
      },
    ],
    banner: {
      type: String,
      default: "store/no-image.png",
    },
    logo: {
      type: String,
      default: "store/no-image.png",
    },
    disclaimerform: {
      type: String,
      default: "",
    },
    menu: [
      {
        type: String,
        default: "menu/no-image.png",
      },
    ],
    menu2: [
      {
        picture: {
          type: String,
          default: "menu/no-image.png",
        },
      },
    ],
    zone: {
      type: String,
      default: "",
    },
    area: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Types.ObjectId,
      default: null,
      ref: "user",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isDelivery: {
      type: Boolean,
      default: false,
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

    store_lang: [
      {
        lang: {
          type: mongoose.Types.ObjectId,
          default: null,
          ref: "language",
        },
        value: {
          type: String,
          default: "",
        },
      },
    ],
    aboutus_lang: [
      {
        lang: {
          type: mongoose.Types.ObjectId,
          default: null,
          ref: "language",
        },
        value: {
          type: String,
          default: "",
        },
      },
    ],
    zone_lang: [
      {
        lang: {
          type: mongoose.Types.ObjectId,
          default: null,
          ref: "language",
        },
        value: {
          type: String,
          default: "",
        },
      },
    ],
    area_lang: [
      {
        lang: {
          type: mongoose.Types.ObjectId,
          default: null,
          ref: "language",
        },
        value: {
          type: String,
          default: "",
        },
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isHalal: {
      type: Boolean,
      default: false,
    },
    isPhysical: {
      type: Boolean,
      default: true,
    },
    slug: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

store.pre("find", function (next) {
  this.populate("user");
  next();
});

store.index({ location: "2dsphere" });
export default mongoose.model("store", store);
