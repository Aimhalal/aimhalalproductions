import order from "../models/order.js";
import storeService from "../services/store.js";
import userService from "../services/user.js";
import userPopulate from "../utils/user.js";

// All Method Relatd to User Modal are defined here
const getOrderById = async (id) => {
  try {
    let data = await order
      .findById({
        _id: id,
      })
      .populate({
        path: "items.item",
        select: {
          item: 1,
          pictures: 1,
        },
      })
      .populate({
        path: "customer",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .populate({
        path: "store",
      })
      .populate({
        path: "assignRider",
        select: {
          fullname: 1,
          email: 1,
          phone: 1,
        },
      })
      .lean();

    // update items quantity based on Order

    return data;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

const nearByOrders = async (query) => {
  try {
    let data = await order
      .find(query)
      .populate({
        path: "items.item",
        select: {
          item: 1,
          pictures: 1,
        },
      })
      .populate({
        path: "customer",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
          location: 1,
          picture: 1,
        },
      })
      .populate({
        path: "store",
      })
      .populate({
        path: "assignRider",
        select: {
          fullname: 1,
          email: 1,
          phone: 1,
        },
      })
      .lean();

    return data;
  } catch (error) {
    return error.message;
  }
};

export default {
  getOrderById,
  nearByOrders,
};
