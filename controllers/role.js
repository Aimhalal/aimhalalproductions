import Joi from "joi";
import roles from "../models/roles.js";
import roleService from "../services/role.js";
import stores from "../models/stores.js";
import users from "../models/users.js";

const store = async (req, res) => {
  try {
    let data = new roles(req.body);
    data = await data.save();
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

const getVendorTypes = async (req, res) => {
  try {
    let data = await roleService.getVendorTypes();
    data = await Promise.all(
      data.map(async (e) => {
        e.name = e.name.toLowerCase();
        let totalStores = await users.countDocuments({
          type: e.name,
        });

        e.count = totalStores;
        return e;
      })
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

const getUpdatedVendors = async (req, res) => {
  try {
    let data = await roleService.getVendorTypes();
    data.push(
      {
        name: "Quran Learning",
        image: "category/quran-learning.png",
      },
      {
        name: "Halal Web",
        image: "category/halal-web.png",
      },

      {
        name: "Cosmetics",
        image: "category/cosmetics.png",
      },
      {
        name: "Events",
        image: "category/events.png",
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

export default {
  store,
  all,
  getVendorTypes,
  getUpdatedVendors,
};
