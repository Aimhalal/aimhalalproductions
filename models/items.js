import mongoose from "mongoose";

const product = new mongoose.Schema(
  {
    item: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    category: [
      {
        type: mongoose.Types.ObjectId,
        default: null,
        ref: "category",
      },
    ],
    other: {
      type: mongoose.Types.ObjectId,
      default: null,
      ref: "category",
    },
    price: {
      type: Number,
      default: 0,
    },
    discounted_price: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discount_percentage: {
      type: Number,
      default: 0,
    },
    delivery_type: {
      type: String,
      default: "",
    },
    delivery_types: {
      type: Array,
      default: [],
    },

    incredients: [
      {
        item: { type: String, default: "" },
        price: { type: Number, default: 0 },
      },
      {
        timestamps: true,
      },
    ],
    pictures: [
      {
        type: String,
        default: ["items/no-image.png"],
      },
    ],

    tags: {
      type: String,
      default: "",
    },

    store: {
      type: mongoose.Types.ObjectId,
      default: null,
      ref: "store",
    },
    user: {
      type: mongoose.Types.ObjectId,
      default: null,
      ref: "user",
    },
    review: [
      {
        customer: {
          type: mongoose.Types.ObjectId,
          default: null,
          ref: "user",
        },
        order: {
          type: mongoose.Types.ObjectId,
          default: null,
          ref: "order",
        },
        rating: {
          type: Number,
          default: 0,
        },
      },
      {
        timestamps: true,
      },
    ],
    keyword: {
      type: [String], // Array of keywords or tags
      default: [],
    },

    // Language items

    item_lang: [
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
    description_lan: [
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
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("product", product);
