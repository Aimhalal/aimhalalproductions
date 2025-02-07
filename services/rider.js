import rider from "../models/rider.js";
import roleService from "../services/role.js";
import helper from "../utils/helpers.js";

// All Method Relatd to User Modal are defined here
const getRiderById = async (id) => {
  try {
    let user = await rider
      .findById({
        _id: id,
      })
      .select({
        password: 0,
        otp: 0,
      })
      .populate("vehicle")
      .lean();
    return user;
  } catch (error) {
    return error.message;
  }
};

const riderAlreadyExist = async (email, username) => {
  try {
    let data = await rider.findOne({
      email,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

const riderExist = async (number) => {
  try {
    let data = await rider.findOne({
      number,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

export default {
  getRiderById,
  riderAlreadyExist,
  riderExist,
};
