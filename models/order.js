// import { boolean } from "joi";
import mongoose, { Mongoose } from "mongoose";
const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      default: "",
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "store",
    },
    estimatedTime: {
      type: String,
      default: "10 Minutes",
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          default: null,
        },

        incredients: [
          {
            item: {
              type: String,
              default: "",
            },
            price: {
              type: Number,
              default: 0,
            },
            quantity: {
              type: Number,
              default: 0,
            },
          },
          {
            timestamps: true,
          },
        ],

        price: {
          type: Number,
          default: 0,
        },

        qty: {
          type: Number,
          default: 0,
        },

        status: {
          type: String,
          default: "new",
        },
      },
    ],

    tip: {
      type: Number,
      default: 0,
    },
    cod: {
      type: Boolean,
    },

    totalPrice: {
      type: Number,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    shippingFees: {
      type: Number,
      default: 0,
    },
    shippingDistance: {
      type: String,
      default: "0 KM",
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "card",
      default: null,
    },
    orderStatus: {
      type: String,
      default: "active",
    },
    acceptOrderStatus: {
      type: Boolean,
      default: false,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    instruction: {
      type: String,
      default: "",
    },
    feedback: {
      type: String,
      default: "",
    },
    customerFeedBack: {
      type: String,
      default: "",
    },
    paymentType: {
      type: String,
      default: "",
    },
    assignRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "riders",
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
    address: {
      type: String,
      default: null,
    },
    orderType: {
      type: String,
      default: "pickup",
    },
    riderLocation: {
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
    isPending: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ items: 1, orderNo: 1, store: 1, assignRider: 1 });
orderSchema.index({ location: "2dsphere" });
orderSchema.index({ riderLocation: "2dsphere" });

export default mongoose.model("orders", orderSchema);
