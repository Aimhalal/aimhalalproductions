import Joi from "joi";
import roles from "../models/roles.js";

const store = async (req, res) => {
  try {
    let data = new roles(req.body);
    data = data.save();
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
const all = async (req, res) => {
  try {
    let data = await roles.find({});
    return res.json({
      status: 200,
      message: error.message,
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
export default {
  store,
  all,
};
