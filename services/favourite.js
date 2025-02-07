// this helper is responsible for response in every Api Request

import favourite from "../models/favourite.js";
import itemService from "../services/product.js";
import storeService from "../services/store.js";
import userPopulate from "../utils/user.js";

const getFavouriteById = async (id, type = "") => {
  try {
    let data = await favourite
      .findById({ _id: id })
      .populate(userPopulate.populate)
      .lean();
    data.item =
      data.type == "product"
        ? await itemService.getProductById(data.item)
        : await storeService.getStoreById(data.item);
    data.item.isFavourite = true;
    return data;
  } catch (error) {
    return error.message;
  }
};

const isFavourite = async (user, store) => {
  try {
    let data = await favourite.findOne({
      item: store,
      user,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

export default {
  getFavouriteById,
  isFavourite,
};
