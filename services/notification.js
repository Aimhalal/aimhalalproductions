import notification from "../models/notification.js";

// All Method Relatd to User Modal are defined here
const getNotificationById = async (id) => {
  try {
    let data = await order
      .find({
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
      .lean();

    // update items quantity based on Order

    return data;
  } catch (error) {
    return error.message;
  }
};

export default {
  getNotificationById,
};
