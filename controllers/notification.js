import notification from "../models/notification.js";
import notificationService from "../services/notification.js";
import helpers from "../utils/helpers.js";

const getNotificationByStore = async (req, res) => {
  let { _id } = req.user.store ? req.user.store : req.user._id;
  try {
    let query = {
      store: _id,
    };

    let data = await helpers.paginate(notification, query, [
      {
        path: "user",
        select: { username: 1, email: 1, number: 1, address: 1 },
      },
    ]);
    let result = data.data;
    let pagination = data.pagination;

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

const getNotificationForUser = async (req, res) => {
  let { _id } = req.user;
  try {
    let query = {
      user: _id,
    };
    console.log(query);
    let data = await helpers.paginate(notification, query, [
      {
        path: "user",
        select: { username: 1, email: 1, number: 1, address: 1 },
      },
    ]);
    let result = data.data;
    let pagination = data.pagination;

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

export default {
  getNotificationByStore,
  getNotificationForUser,
};
