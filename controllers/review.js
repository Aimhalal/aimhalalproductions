import Joi from "joi";
import roles from "../models/roles.js";
import roleService from "../services/role.js";
import reviewService from "../services/review.js";
import review from "../models/review.js";
import helpers from "../utils/helpers.js";
import mongoose from "mongoose";

const store = async (req, res) => {
  let { Order, store, item, rating, message, type } = req.body;
  let query = {};
  try {
    // query to check already made reviews

    query.Order = Order;
    query.customer = req.user._id;
    query.store = store;
    query.item = item;
    // query.rating = rating
    // query.message = message
    // query.type = type

    // return res.json(query);

    // check if review is already done
    let checkReview = await reviewService.checkReviewById(query);
    if (checkReview)
      return res.json({
        status: 409,
        messaege: "Review Already Given",
        data: {},
      });

    req.body.customer = query.customer;

    let data = new review(req.body);
    data = await data.save();

    // get user by id

    data = await reviewService.getReviewById(data._id);

    return res.json({
      status: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const getStoreReviews = async (req, res) => {
  let query = {};
  let { id } = req.params;
  try {
    query.store = id;
    let data = await helpers.paginate(review, query);
    let result = data.data;
    let pagination = data.pagination;

    result = await Promise.all(
      result.map(async (e) => {
        return await reviewService.getReviewById(e._id);
      })
    );

    return res.json({
      status: 200,
      message: "success",
      data: result,
      pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

// App Store Reviews

const getSingleItemReviews = async (req, res) => {
  let { id } = req.params;
  let query = {
    item: mongoose.Types.ObjectId(id),
  };
  try {
    let data = await helpers.paginate(
      review,
      query,
      [
        {
          path: "customer",
          select: {
            customer: 1,
            message: 1,
            rating: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ],
      { customer: 1, message: 1, rating: 1, createdAt: 1, updatedAt: 1 }
    );

    return res.json({
      status: 200,
      message: "success",
      data: data.data,
      pagination: data.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.messaege,
      data: {},
    });
  }
};

const reviewsByRating = async (req, res) => {
  let query = {};
  let totalReviews = 0;
  let averageReviewCount = 0;
  try {
    totalReviews = await review.find({
      store: req.params.id,
    });

    // Average Review

    const averageReview = [
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ];

    const resultRev = await review.aggregate(averageReview);

    if (resultRev.length > 0) {
      averageReviewCount = resultRev[0].averageRating;
    }
    const allRatingCategories = Array.from(
      { length: 5 },
      (_, index) => index + 1
    );

    const aggregatePipeline = [
      {
        $match: {
          store: req.params.id,
        },
      },
      {
        $group: {
          _id: "$rating",
          users: { $sum: 1 },
          userArray: { $push: { reviewId: "$_id" } },
        },
      },
      {
        $project: {
          rating: { $ifNull: ["$_id", { $literal: allRatingCategories }] },
          users: { $ifNull: ["$users", 0] },
          userArray: { $ifNull: ["$userArray", []] },
          _id: 0,
        },
      },
    ];

    let result = await review.aggregate(aggregatePipeline);

    // Map the results to ensure all rating categories are present
    result = allRatingCategories.map((rating) => {
      const existingEntry = result.find((entry) => entry.rating === rating);
      return existingEntry || { rating, users: 0, userArray: [] };
    });
    let data = result;
    result = await Promise.all(
      data.map(async ({ userArray, ...rev }) => {
        rev.reviews = userArray.length
          ? await Promise.all(
              userArray.map(async ({ reviewId }) =>
                reviewService.getReviewById(reviewId)
              )
            )
          : [];
        delete rev.userArray;
        return rev;
      })
    );

    return res.json({
      status: 200,
      message: "success",
      data: result,
      analytics: { totalReviews: totalReviews.length, averageReviewCount },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// Ending App Store Reviews

export default {
  store,
  getStoreReviews,
  getSingleItemReviews,
  reviewsByRating,
};
