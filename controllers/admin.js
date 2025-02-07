import Joi from "joi";
import stores from "../models/stores.js";
import storeServices from "../services/store.js";
import userService from "../services/user.js";
import vendorService from "../services/role.js";
import fs from "fs";
import users from "../models/users.js";
import items from "../models/items.js";
import order from "../models/order.js";
import category from "../models/category.js";
import bcrypt from "bcrypt";
import helpers from "../utils/helpers.js";
import favourite from "../models/favourite.js";
import mongoose from "mongoose";
import moment from "moment";
import Newsletter from "../models/newsletter.js";
import language from "../models/language.js";
import roleService from "../services/role.js";
import translate from "../utils/translate.js";

import { Readable } from "stream"; // Import the Readable class from the 'stream' module
import excel from "exceljs";
import ingredients from "../models/ingredients.js";
import axios from "axios";
import path from "path";
import activity from "../models/activity.js";
import role from "../services/role.js";
import { IngredientList } from "../models/ingredientList.js";

const today = moment().startOf("day");
const sunday = today.clone().startOf("week");
const saturday = today.clone().endOf("week");

const home = async (req, res) => {
  let totalUsers = 0;
  let totalPartners = 0;
  let totalRiders = 0;
  let totalRevenue = 0;
  const currentDate = new Date();

  try {
    // find total Users
    totalUsers = await users.find({
      role: "6596b2c96bbd4f160a35394b",
    });
    // total Partners
    totalPartners = await users.find({
      role: "659402c400228e9c878cbe2c",
    });

    // total Revenue this month

    const aggregatePipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1), // Start of the current year
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ];
    const result = await order.aggregate(aggregatePipeline);

    // Registered Partners

    const appUsers = await helpers.paginate(users);

    //

    let partners = await users
      .find({
        role: mongoose.Types.ObjectId("659402c400228e9c878cbe2c"),
      })
      .select({ _id: 1 })
      .limit(3);
    partners = await Promise.all(
      partners.map(async (e) => {
        return await userService.getUserById(e._id);
      })
    );

    // Analytics section

    const orders = await order.find({
      createdAt: {
        $gte: sunday.startOf("day").toDate(),
        $lte: saturday.endOf("day").toDate(),
      },
    });
    const weeklyOrders = Array.from({ length: 7 }, (_, index) => {
      const startOfDay = sunday.clone().add(index, "days").startOf("day");
      const endOfDay = sunday.clone().add(index, "days").endOf("day");

      const dayLabel = startOfDay.format("dddd");

      const dayOrders = orders.filter(
        (order) =>
          moment.utc(order.createdAt).isSameOrAfter(startOfDay) &&
          moment.utc(order.createdAt).isSameOrBefore(endOfDay)
      );

      return {
        label: dayLabel,
        orders: dayOrders.length,
      };
    });

    return res.json({
      status: 200,
      message: "success",
      data: {
        totalUsers: totalUsers.length,
        totalPartners: totalPartners.length,
        totalRiders,
        totalRevenue: result.length ? result[0].totalRevenue : 0,
        registeredPartners: partners,
        users: appUsers.data,
        weeklyOrders,
      },
      pagination: appUsers.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};
const analytics = async (req, res) => {
  let activeStores = [];
  let totalUsers = [];
  let totalPartners = [];
  let totalRevenue = [];
  let bestStores = [];
  let analytics = [];

  try {
    // Active stores

    let activeStores = await stores.find({
      isActive: false,
    });

    // Ending Active Stores

    // find Total  Users

    let findStores = await users.find({
      role: { $ne: mongoose.Types.ObjectId("659402bf00228e9c878cbe2a") },
    });

    // End Final Users

    // find partner  Users

    let findPartners = activeStores.length;
    // End partner Users

    // Total Revenue

    const result = await order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    if (result.length > 0) {
      totalRevenue = result[0].totalRevenue.toFixed(2);
    }

    // Endign Total Revenue

    // Top Revenue product

    const topRevenue = await order.aggregate([
      {
        $group: {
          _id: "$store",
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      {
        $lookup: {
          from: "stores", // Use the actual name of your store collection
          localField: "_id",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $unwind: "$store",
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Ending

    // Analytics for User Registration

    const orders = await users.find({
      createdAt: {
        $gte: sunday.toDate(),
        $lte: saturday.toDate(),
      },
      role: mongoose.Types.ObjectId("6596b2c96bbd4f160a35394b"),
    });

    const weeklyOrders = Array.from({ length: 7 }, (_, index) => {
      const startOfDay = sunday.clone().add(index, "days").startOf("day");
      const endOfDay = sunday.clone().add(index, "days").endOf("day");

      const dayLabel = startOfDay.format("dddd");

      const dayOrders = orders.filter(
        (order) =>
          moment.utc(order.createdAt).isSameOrAfter(startOfDay) &&
          moment.utc(order.createdAt).isSameOrBefore(endOfDay)
      );

      return {
        label: dayLabel,
        orders: dayOrders.length,
      };
    });

    // Ending Analytics for user registration

    // Store Analytics

    const storeAnalytics = await users.find({
      createdAt: {
        $gte: sunday.toDate(),
        $lte: saturday.toDate(),
      },
      role: mongoose.Types.ObjectId("659402c400228e9c878cbe2c"),
    });

    const weeklyStoreAnalytics = Array.from({ length: 7 }, (_, index) => {
      const startOfDay = sunday.clone().add(index, "days").startOf("day");
      const endOfDay = sunday.clone().add(index, "days").endOf("day");

      const dayLabel = startOfDay.format("dddd");

      const dayOrders = storeAnalytics.filter(
        (order) =>
          moment.utc(order.createdAt).isSameOrAfter(startOfDay) &&
          moment.utc(order.createdAt).isSameOrBefore(endOfDay)
      );

      return {
        label: dayLabel,
        orders: dayOrders.length,
      };
    });

    // ending Store analytics

    return res.json({
      status: 200,
      message: "success",
      data: {
        activeStores: activeStores.length,
        totalUsers: findStores.length,
        totalPartners: totalPartners.length,
        totalRevenue: totalRevenue,
        bestStores: topRevenue,
        analytics: {
          userMap: weeklyOrders,
          storeMap: weeklyStoreAnalytics,
        },
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

const updateProfile = async (req, res) => {
  try {
    // check if store already exisit in store
    let checkStore = await userService.getUserById(req.user._id);
    if (!checkStore)
      return res.json({ status: 404, message: "no user found", data: {} });

    // update profile picture

    // if (checkStore.logo) {
    //     // Assuming the old profile pictures are stored in the 'uploads/profilePictures' directory
    //     const oldProfilePicturePath = `public/${checkStore.logo}`;

    //     fs.unlinkSync(oldProfilePicturePath);
    // }

    // update store image

    const dirOne = "public/store";

    if (req.files) {
      let picture = req.files.logo;

      picture.name = picture.name.replace(/\s+/g, "_"); // Replace all whitespace characters with underscores

      const mobile_logo = req.files.logo.data;
      let mobile_logoResponse = await helpers.storeImageWithValidation(
        mobile_logo
      );

      if (
        picture &&
        (mobile_logoResponse.width !== 180 ||
          mobile_logoResponse.height !== 180)
      ) {
        return res.status(200).json({
          status: 400,
          message:
            "Invalid Category dimensions. Logo size should be exactly 180X180 pixels.",
          data: "",
        });
      }

      const dirOne = "public/store";
      let imageNameOne;
      if (picture) {
        let imageName = `${Date.now()}_${picture.name}`;
        imageNameOne = `${dirOne}/` + imageName;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        picture.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              message: error.message,
              data: "",
            });
          }
        });

        req.body.picture = `store/${imageName}`;
      }
    }

    await users.findByIdAndUpdate(
      {
        _id: req.user._id,
      },
      {
        $set: {
          picture: req.body.picture,
        },
      }
    );

    // get store information

    let data = await userService.getUserById(req.user._id);

    return res.json({
      status: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const updateSettings = async (req, res) => {
  let { _id } = req.user;
  try {
    // validate inputs
    let newPass = req.body.password;
    let schema = Joi.object({
      username: Joi.string(),
      password: Joi.string(),
      confirm_password: Joi.string().when("password", {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);

      // await helpers.updateSettingPassword('connect@aimhalal.com',newPass)
    }

    if (req.body.confirm_password) {
      delete req.body.confirm_password;
    }

    //

    let data = await users.findByIdAndUpdate(
      {
        _id: _id,
      },
      {
        $set: req.body,
      }
    );

    // get user information

    data = await userService.getUserById(_id);

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

const newsletter = async (req, res) => {
  try {
    let data = await helpers.paginate(Newsletter);
    return res.json({
      status: 200,
      message: "success",
      data: data.data,
      pagination: data.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
    });
  }
};

const storeLanguage = async (req, res) => {
  try {
    let checkAlreadyExists = await language.findOne({
      code: req.body.code,
      name: req.body.name,
    });
    if (checkAlreadyExists)
      return res.json({ status: 409, message: "already added", data: {} });
    let data = new language(req.body);
    data = await data.save();

    return res.json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
    });
  }
};

const listLanguages = async (req, res) => {
  try {
    let data = await helpers.paginate(language);

    return res.json({
      status: 200,
      message: "success",
      data: data.data,
      pagination: data.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
    });
  }
};

// Ingredients

const importIngredients = async (req, res) => {
  let products = [];
  try {
    if (!req.files) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const excelData = req.files.file.data;

    // Create a readable stream from the buffer
    const stream = new Readable();
    stream.push(excelData);
    stream.push(null); // End the stream

    const workbook = new excel.Workbook();

    await workbook.xlsx.read(stream);

    const worksheet = workbook.getWorksheet(1); // Assuming the data is in the first sheet
    const totalRows = worksheet.rowCount;

    let allCats = [];

    for (let rowNumber = 1; rowNumber <= totalRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (row.getCell(1).value) {
        let item = row.getCell(1).value; // Get the value of cell B
        let type = row.getCell(2).value; // Get the value of cell B

        // halal type

        item = item.toLowerCase();
        type = type ? type.toLowerCase() : "";

        products.push({
          item,
          type,
        });
      }
    }

    await ingredients.insertMany(products);

    return res.json({
      status: 200,
      message: "success",
      data: products,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

const getIngredients = async (req, res) => {
  let query = {};
  let { kewyord } = req.query;
  console.log("ingredients list");
  try {
    query.item = {
      $regex: new RegExp(kewyord, "i"), // Case-insensitive search
    };

    let data = await helpers.paginate(IngredientList, query);
    return res.json({
      status: 200,
      message: "success",
      data: data.data,
      pagination: data.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

// Store Creation and Check If user already exist

const store = async (req, res) => {
  try {
    let schema = Joi.object({
      store_name: Joi.string().required(),
      store_url: Joi.any(),
      opening_hours: Joi.string().required(),
      banner: Joi.any(),
      logo: Joi.any(),
      zone: Joi.any(),
      area: Joi.any(),
      longitude: Joi.any(),
      latitude: Joi.any(),
      email: Joi.string().required(),
      number: Joi.any(),
      types: Joi.any(),
      document: Joi.any(),
      isHalal: Joi.any(),
      isPhysical: Joi.any(),
    });
    let data;
    let message;
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    let checkCategoryforHalalWeb = await role.checkHalalWebCategory(
      req.body.types
    );
    if (checkCategoryforHalalWeb?.group == "Halal Web") {
      if (!req.body.email || !req.body.number) {
        return res.json({
          status: 400,
          message: "Email,Number and Address are mandatory",
          data: {},
        });
      }
      if (req.body.isPhysical == true) {
        if (!req.body.area) {
          return res.json({
            status: 400,
            message: "Address is Required for the Physical Stores",
            data: {},
          });
        }
      }
    }

    // check user exist or create new user
    let checkUser = await userService.userAlreadyExist(req.body.email);

    // check if user is a customer, and has no vendor account

    let findRole = await roleService.getRoleByName("vendor");

    if (checkUser?.isCustomer) {
      if (checkUser.store) {
        return res.json({
          status: 400,
          message:
            "the user is a customer, and contains a vendor account already",
          data: {},
        });
      }
      // Add Store information here

      req.body.number = checkUser.number;
      req.body.role = findRole._id;

      (req.body.status = "accepted"), (req.body.isActive = true);
      req.body.type = req.body.types;
      req.body.isVendor = true;

      await users.findByIdAndUpdate(
        {
          _id: checkUser._id,
        },
        {
          $set: req.body,
        },
        {
          new: true,
        }
      );

      await helpers.sendEmailsForCustomer(checkUser.email);
      message =
        "the user is already a customer, a vendor account has been successfully created, using the same credentials";
      data = await userService.getUserById(checkUser._id);

      // return res.json({
      //     status : 200,
      //     message : "the user is already a customer, a vendor account has been successfully created, using the same credentials",
      //     data  : checkUser
      // })
    } else if (!checkUser) {
      let password = helpers.generatePassword();

      if (req.body.number) {
        // Assuming req.body.number contains the number to remove
        let newStr = req.body.number.replace(/\+/g, ""); // Using a regular expression with the global flag to remove all occurrences of '+'
        req.body.number = newStr;
      }
      // get user role

      req.body.role = findRole._id;

      // check if document is uploaded

      // Default set to accepted and isActive:true

      (req.body.status = "accepted"), (req.body.isActive = true);
      req.body.type = req.body.types;

      data = new users(req.body);
      data = await data.save();

      // translate user
      await translate.translateText(data, "user");

      // send an email to the admin, for new vendor registration
      let otp = Math.floor(1000 + Math.random() * 9000);

      if (findRole.name == "vendor") {
        // await helpers.sendOtp(data.email, otp, 'registration')

        // update user information
        let pass = await bcrypt.hash(password, 10);

        await users.findByIdAndUpdate(
          {
            _id: data._id,
          },
          {
            $set: {
              otp,
              password: pass,
            },
          }
        );
        await helpers.sendAcceptanceEmail(data.email, password);
      }

      // retrive user information from the route

      data = await userService.getUserById(data._id);
    } else {
      return res.json({ status: 409, message: "User Already Exist", data: {} });
    }

    // check store alreay exists

    let checkStore = await storeServices.checkStoreAlreadyExist(req.body);
    if (checkStore)
      return res.json({
        status: 409,
        message: "Store Already Exist",
        data: {},
      });

    // get userid

    req.body.user = data._id;
    req.body.types = req.body.types;
    req.body.isAdmin = true;

    req.body.opening_hours = JSON.parse(req.body.opening_hours, true);

    // upload files to the store

    if (req.files) {
      let banner = req.files.banner;
      let logo = req.files.logo;
      const dirOne = "public/store";
      let imageNameOne;
      let mainImage;
      if (banner) {
        banner.name = banner.name.replace(/\s+/g, "_"); // Replace all whitespace characters with underscores

        const mobile_banner = req.files.banner.data;
        let mobile_bannerResponse = await helpers.storeImageWithValidation(
          mobile_banner
        );

        console.log(mobile_bannerResponse);

        if (
          banner &&
          (mobile_bannerResponse.width !== 1600 ||
            mobile_bannerResponse.height !== 325)
        ) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid banner dimensions. Banner size should be exactly 1600X325 pixels.",
            data: "",
          });
        }

        mainImage = `${Date.now()}_` + banner.name;
        imageNameOne = `${dirOne}/${mainImage}`;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        banner.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              message: error.message,
              data: "",
            });
          }
        });

        req.body.banner = `store/${mainImage}`;
      }

      if (logo) {
        logo.name = logo.name.replace(/\s+/g, "_"); // Replace all whitespace characters with underscores

        const mobile_logo = req.files.logo.data;
        let mobile_logoResponse = await helpers.storeImageWithValidation(
          mobile_logo
        );

        if (
          logo &&
          (mobile_logoResponse.width !== 180 ||
            mobile_logoResponse.height !== 180)
        ) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid logo dimensions. Logo size should be exactly 180X180 pixels.",
            data: "",
          });
        }

        mainImage = `${Date.now()}_` + logo.name;
        imageNameOne = `${dirOne}/${mainImage}`;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        logo.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              message: error.message,
              data: "",
            });
          }
        });

        req.body.logo = `store/${mainImage}`;
      }
    }

    if (req.body.area) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        req.body.area
      )}&key=${process.env.Map_API}`;
      const response = await axios.get(url);
      if (response.data.status !== "OK") {
        return res.json({
          status: 500,
          message: `Invalid Address ${req.body.area}`,
          data: {},
        });
      }
      const location = response.data.results[0].geometry.location;

      let newLocation = {
        type: "Point",
        coordinates: [location.lng, location.lat],
      };

      req.body.latitude = location.lat;
      req.body.longitude = location.lng;

      req.body.location = newLocation;
    }

    let store = new stores(req.body);
    store = await store.save();

    // Update language of the store

    await translate.translateText(store, "store");

    //  update user store information

    await users.findByIdAndUpdate(
      {
        _id: data._id,
      },
      {
        $set: {
          store: store._id,
          isActive: true,
        },
      }
    );

    // get store information from the helper

    store = await storeServices.getStoreById(store._id);
    await helpers.activityLog({
      adminId: req.user._id,
      action: `has created a new Store ${req.body.store_name}`,
    });

    return res.json({
      status: 200,
      message: message ? message : "success",
      data: store,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const updateData = async (req, res) => {
  try {
    let schema = Joi.object({
      email: Joi.string(),
      number: Joi.any(),
      isDelivery: Joi.any(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    // generate a random password for the user
    let password = helpers.generatePassword();
    let pass = await bcrypt.hash(password, 10);

    let data = await users.findByIdAndUpdate(
      {
        _id: req.params.id,
      },
      {
        $set: {
          email: req.body.email,
          number: req.body.number,
          password: pass,
        },
      },
      {
        new: true,
      }
    );

    let storeData = await storeServices.getStoreById(data.store);

    await stores.findByIdAndUpdate(
      {
        _id: storeData._id,
      },
      {
        $set: {
          isDelivery: req.body.isDelivery,
        },
      },
      {
        new: true,
      }
    );

    await helpers.sendUpdatedEmail(data.email, data.number, password);

    return res.json({
      status: 200,
      message: "successfully update email and phone",
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
const logs = async (req, res) => {
  try {
    let logs = await activity.find({}).lean();
    logs = await Promise.all(
      logs.map(async (e) => {
        e.adminId = await users.findById(e.adminId);
        return e;
      })
    );
    return res.json({
      status: 200,
      message: "success",
      data: logs,
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
  home,
  analytics,
  updateSettings,
  updateProfile,
  newsletter,
  storeLanguage,
  listLanguages,
  importIngredients,
  getIngredients,
  store,
  updateData,
  logs,
};
