import mongoose from "mongoose";
import order from "./order.js";
import favourite from "./favourite.js";
import notification from "./notification.js";

const users = new mongoose.Schema(
  {
    username: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: "profile/no-image.png",
    },

    dob: {
      type: Date,
      default: null,
    },
    email: {
      type: String,
      default: "",
    },
    number: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      default: "",
    },
    role: {
      type: mongoose.Types.ObjectId,
      ref: "roles",
    },
    document: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: false,
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
    store: {
      type: mongoose.Types.ObjectId,
      ref: "store",
      default: null,
    },
    type: {
      type: String,
      default: "user",
    },
    address: {
      type: String,
      default: "",
    },
    zipcode: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    card: [
      {
        card: {
          type: mongoose.Types.ObjectId,
          ref: "card",
          default: null,
        },
      },
    ],
    socket: {
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

    username_lang: [
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
    address_lang: [
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
    city_lang: [
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

    typeOfAddress: [
      {
        type: {
          type: String,
          default: "office",
        },
        street: {
          type: String,
          default: "-",
        },
        appartment: {
          type: String,
          unique: "-",
        },
      },
      {
        timestamps: true,
      },
    ],

    request_id: {
      type: String,
      default: "",
    },

    isVendor: {
      type: Boolean,
      default: false,
    },
    isCustomer: {
      type: Boolean,
      default: false,
    },
    isStoreBlocked: {
      type: Boolean,
      default: false,
    },

    isvendorRequest: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

users.pre("findOneAndDelete", async function (next) {
  try {
    // Access the user being deleted
    const user = this;

    // Delete related orders
    await order.deleteMany({ customer: user._id });

    // Delete Favourites

    await favourite.deleteMany({ user: user._id });

    // Delete notifications

    await notification.deleteMany({ user: user._id });
  } catch (error) {
    // Handle any errors
    next(error);
  }
});

export default mongoose.model("user", users);
