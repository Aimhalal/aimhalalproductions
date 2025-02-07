import users from "../models/users.js";
import roleService from "../services/role.js";
import helper from "../utils/helpers.js";

// All Method Relatd to User Modal are defined here
const getUserById = async (id) => {
  try {
    let user = await users
      .findById({
        _id: id,
      })
      .select({
        password: 0,
        otp: 0,
      })
      .populate({
        path: "store",
      })
      .populate({
        path: "role",
        select: { name: 1 },
      })
      .populate({
        path: "card.card",
      })
      .lean();
    return user;
  } catch (error) {
    return error.message;
  }
};

const userAlreadyExist = async (email, username) => {
  try {
    let data = await users.findOne({
      email,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

const userExist = async (number) => {
  try {
    let data = await users.findOne({
      number,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

export default {
  getUserById,
  userAlreadyExist,
  userExist,
};
