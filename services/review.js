import promotion from "../models/promotion.js";
import review from "../models/review.js";
import store from "../models/stores.js";

const checkReviewById = async (query) => {
  try {
    let data = await review.findOne(query);
    return data;
  } catch (error) {
    return error.message;
  }
};

const getReviewById = async (id) => {
  try {
    let data = await review
      .findById({ _id: id })
      .populate({
        path: "customer",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .select({
        customer: 1,
        message: 1,
        rating: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();
    return data;
  } catch (error) {
    return error.message;
  }
};

const getReviewByItem = async (id) => {
  try {
    let data = await review
      .find({ item: id })
      .limit(5)
      .populate({
        path: "customer",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .select({
        customer: 1,
        message: 1,
        rating: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();
    return data;
  } catch (error) {
    return error.message;
  }
};

const getReviewByStore = async (id) => {
  try {
    let data = await review
      .find({ store: id })
      .limit(5)
      .populate({
        path: "customer",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .select({
        customer: 1,
        message: 1,
        rating: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();
    return data;
  } catch (error) {
    return error.message;
  }
};

export default {
  checkReviewById,
  getReviewById,
  getReviewByItem,
  getReviewByStore,
};
