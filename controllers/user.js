import mongoose from "mongoose";
import users from "../models/users.js";
import helpers from "../utils/helpers.js";
import userService from "../services/user.js";
import orderService from "../services/order.js";
import bcrypt from "bcrypt";
import order from "../models/order.js";

// admin user activities

const index = async (req, res) => {
  let { page, limit, status, search } = req.query;
  try {
    let query = {
      role: mongoose.Types.ObjectId("659402c400228e9c878cbe2c"),
    };
    if (status) {
      query.status = status;
    }
    if (search) {
      query.username = new RegExp(search, "i");
    }

    const result = await helpers.paginate(users, query);

    return res.json({
      status: 200,
      message: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};
const acceptRequest = async (req, res) => {
  let { status, userid } = req.body;
  try {
    // check user is a customer

    let checkCustomer = await users.findById({ _id: userid });
    if (!checkCustomer.isCustomer) {
      // generate a random user password, so user can login in as a  vendor

      let password = helpers.generatePassword();
      let newPassword = await bcrypt.hash(password, 10);

      let data = await users.findByIdAndUpdate(
        {
          _id: mongoose.Types.ObjectId(userid),
        },
        {
          $set: {
            status,
            password: newPassword,
            isActive: status == "accepted" ? true : false,
          },
        },
        {
          new: true,
        }
      );

      // send user and email notification
      await helpers.sendAcceptanceEmail(data.email, password);
    } else {
      await users.findByIdAndUpdate(
        {
          _id: mongoose.Types.ObjectId(userid),
        },
        {
          $set: {
            status,
            isActive: status == "accepted" ? true : false,
            isVendor: true,
            isStoreBlocked: false,
          },
        },
        {
          new: true,
        }
      );
      await helpers.sendEmailsForCustomer(checkCustomer.email);
    }

    let user = await userService.getUserById(userid);

    return res.json({
      status: 200,
      message: "success",
      data: user,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const userActivities = async (req, res) => {
  let { search } = req.query;
  let activeQuery = {};
  let blockQuery = {};
  let query = {};

  let totalUsersCount = 0;
  let totalUsers = 0;
  let blockUserCount = 0;

  let activeUsers = [];
  let blockedUsers = [];

  const currentDate = new Date();

  if (search) {
    const regex = new RegExp(search, "i");
    activeQuery.$or = [
      { username: regex },
      { email: regex },
      { number: regex },
    ];

    blockQuery.$or = [{ username: regex }, { email: regex }, { number: regex }];

    activeQuery.$and = [
      { role: mongoose.Types.ObjectId("6596b2c96bbd4f160a35394b") },
      { isActive: 1 },
    ];
    blockQuery.$and = [
      { role: mongoose.Types.ObjectId("6596b2c96bbd4f160a35394b") },
      { isActive: false },
    ];
  } else {
    activeQuery.$and = [
      { role: mongoose.Types.ObjectId("6596b2c96bbd4f160a35394b") },
      { isActive: 1 },
    ];
    blockQuery.$and = [
      { role: mongoose.Types.ObjectId("6596b2c96bbd4f160a35394b") },
      { isActive: false },
    ];
  }

  try {
    // total Users as customers
    totalUsers = await helpers.paginate(
      users,
      blockQuery,
      { role: mongoose.Types.ObjectId("6596b2c96bbd4f160a35394b") },
      { username: 1, email: 1, number: 1, createdAt: 1 }
    );
    activeUsers = await helpers.paginate(
      users,
      activeQuery,
      {},
      { username: 1, email: 1, number: 1, createdAt: 1, isActive: 1 }
    );

    totalUsersCount = totalUsers.data.length;

    // blocked Users
    blockedUsers = await helpers.paginate(
      users,
      blockQuery,
      {},
      { username: 1, email: 1, number: 1, createdAt: 1, isActive: 1 }
    );
    blockUserCount = blockedUsers.data.length;

    // find Active Users

    return res.json({
      status: 200,
      message: "success",
      data: {
        totalUsers: totalUsersCount,
        blockUsers: blockUserCount,
        activeUsers: activeUsers.data,
        blockedUsers: blockedUsers.data,
        pagination: blockedUsers.pagination,
      },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const singleUserActivity = async (req, res) => {
  let { id } = req.params;
  try {
    let singleUser = await userService.getUserById(id);

    let Orders = await helpers.paginate(order, { customer: id });
    console.log(Orders);
    let pagination = Orders.pagination;
    let result = Orders.data;
    result = await Promise.all(
      result.map(async (e) => {
        return await orderService.getOrderById(e._id);
      })
    );
    singleUser.orders = result;

    return res.json({
      status: 200,
      message: "sucess",
      data: singleUser,
      pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    let data = await users.findById({
      _id: req.body.user,
    });
    if (!data)
      return res.json({ status: 404, message: "customer not found", data: {} });

    // update user status
    data = await users.findByIdAndUpdate(
      {
        _id: req.body.user,
      },
      {
        $set: {
          isActive: req.body.isActive,
        },
      },
      {
        new: true,
      }
    );

    return res.json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// Admins Ending user activities

const address = async (req, res) => {
  let { _id } = req.user;
  try {
    let data = await users.findByIdAndUpdate(
      {
        _id,
      },
      {
        $push: {
          typeOfAddress: req.body,
        },
      },
      {
        new: true,
      }
    );

    data = await userService.getUserById(data._id);

    return res.json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

export default {
  index,
  acceptRequest,

  //
  userActivities,
  toggleUserStatus,
  singleUserActivity,
  address,
};
