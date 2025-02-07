import mongoose from "mongoose";
import items from "./items.js";

const category = new mongoose.Schema(
  {
    partnerType: {
      type: String,
      default: "restaurent",
    },
    name: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: "category/no-image.png",
    },
    default_code: {
      type: String,
      default: "-",
    },
    store: {
      type: mongoose.Types.ObjectId,
      default: null,
      ref: "store",
    },
    default_stores: [
      {
        store: {
          type: mongoose.Types.ObjectId,
          default: null,
          ref: "store",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    name_lang: [
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

category.pre("remove", async function (next) {
  const categoryId = this._id;

  try {
    // Remove references to the category in the product collection

    await items.updateMany(
      { category: categoryId },
      { $pull: { category: categoryId, other: categoryId } }
    );

    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("category", category);
