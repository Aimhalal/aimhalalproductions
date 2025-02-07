import Joi from "joi";
import rider from "../models/rider.js";
import riderVehicle from "../models/riderVehicle.js";
import userService from "../services/user.js";
import riderService from "../services/rider.js";
import helper from "../utils/helpers.js";
import helpers from "../utils/helpers.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "./user.js";
import roleService from "../services/role.js";
import fs from "fs";
import translate from "../utils/translate.js";
import path from "path";
import mongoose from "mongoose";
import users from "../models/users.js";
import roles from "../models/roles.js";
import orderService from "../services/order.js";

const store = async (req, res) => {
  try {
    // Validate the request body
    let schema = Joi.object({
      fullname: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      vehiclename: Joi.string().required(),
      vehiclenumber: Joi.string().required(),
      document: Joi.any(),
      picture: Joi.any(),
      license: Joi.any(),
    });

    const { error, value } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: 400, message: error.details[0].message, data: {} });

    // Check if user already exists
    let checkUser = await userService.userAlreadyExist(value.email);
    if (checkUser)
      return res
        .status(409)
        .json({
          status: 409,
          message: "Email or Phone number is already in use",
          data: {},
        });

    // Handle file uploads
    if (req.files) {
      const dirOne = "public/vehicle";
      if (!fs.existsSync(dirOne)) {
        fs.mkdirSync(dirOne, { recursive: true });
      }

      const handleFileUpload = (file, fieldName) => {
        let imageName = `${Date.now()}_${file.name}`;
        let imageNameOne = `${dirOne}/${imageName}`;
        file.mv(imageNameOne, (err) => {
          if (err)
            return res
              .status(200)
              .json({
                status: 400,
                message: `Error uploading ${fieldName}: ${err.message}`,
                data: {},
              });
        });
        return `vehicle/${imageName}`;
      };
    }

    if (!req?.files?.document || !req?.files?.picture || !req?.files?.license) {
      return res.json({
        status: 500,
        message: "All files are required",
      });
    }

    let vehicleData = {
      vehiclename: value.vehiclename,
      vehiclenumber: value.vehiclenumber,
      document: value.document,
      picture: value.picture,
      license: value.license,
    };

    let newVehicle = new riderVehicle(vehicleData);
    newVehicle = await newVehicle.save();

    // Add the vehicle ID to the rider's vehicle array
    value.vehicle = [newVehicle._id];

    // Save user data to the database
    let newRider = new rider(value);
    newRider = await newRider.save();

    await riderVehicle.findByIdAndUpdate(
      { _id: newVehicle._id },
      { $set: { riderId: newRider._id } }
    );

    // Retrieve the user information
    let riderData = await riderService.getRiderById(newRider._id);

    // Respond with success
    return res
      .status(200)
      .json({ status: 200, message: "Success", data: riderData });
  } catch (error) {
    console.error(error);
    return res
      .status(200)
      .json({ status: 400, message: error.message, data: {} });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    let schema = Joi.object({
      password: Joi.string().required(),
      email: Joi.string().required(),
      fcmToken: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    let checkUser = await rider
      .findOne({ email: email, approval: "accepted" })
      .lean();
    if (!checkUser) {
      return res.json({
        status: 409,
        messgae: "Invalid Account",
        data: {},
      });
    }

    const isPassword = await bcrypt.compare(password, checkUser.password);

    // const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(200).json({
        status: 400,
        message: "Invalid Password",
        data: null,
      });
    }
    // add a jwtToken

    const token = jwt.sign(
      { id: checkUser._id, fullname: checkUser.fullname },
      process.env.JWT_SECRET
    );
    await rider.findByIdAndUpdate(
      { _id: checkUser._id },
      {
        $set: {
          verificationToken: token,
          fcmToken: req.body.fcmToken,
        },
      }
    );

    // get user information from the helper
    let data = await riderService.getRiderById(checkUser._id);

    return res.json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    return res.status(200).json({
      status: 500,
      message: "An unexpected error occurred while proceeding your request.",
      data: null,
      trace: error.message,
    });
  }
};

const view = async (req, res) => {
  let { page, limit, status, search } = req.query;
  try {
    let checkAuth = await roles.findOne({ _id: req.user.role });

    // check admin
    if (!checkAuth.username == "admin") {
      return res.json({
        status: 401,
        message: "UNAUTHORIZED, invalid credentials",
      });
    }

    let pending = [];
    let accepted = [];

    pending = await rider
      .find({ approval: "pending", isActive: true })
      .populate("vehicle");
    accepted = await rider
      .find({ approval: "accepted", isActive: true })
      .populate("vehicle");

    pending = helpers.paginateNew(pending, 1, 150);
    accepted = helpers.paginateNew(accepted, 1, 150);

    return res.json({
      status: 200,
      message: "List of requests",
      data: { pending: pending, acccepted: accepted },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const acceptRequest = async (req, res) => {
  let { status, userid } = req.body;
  try {
    let checkAuth = await roles.findOne({ _id: req.user.role });

    // check admin
    if (!checkAuth.username == "admin") {
      return res.json({
        status: 401,
        message: "UNAUTHORIZED, invalid credentials",
      });
    }

    // check user is a customer

    let checkRider = await rider.findOne({
      _id: mongoose.Types.ObjectId(userid),
    });
    if (!checkRider) {
      return res.json({
        status: 404,
        message: error.message,
        data: null,
      });
    }
    // generate a random user password, so user can login in as a  vendor

    let password = helpers.generatePassword();
    let newPassword = await bcrypt.hash(password, 10);

    let data = await rider.findByIdAndUpdate(
      {
        _id: mongoose.Types.ObjectId(userid),
      },
      {
        $set: {
          password: newPassword,
          approval: status,
        },
      },
      {
        new: true,
      }
    );

    // send user and email notification
    await helpers.sendAcceptanceEmail(data.email, password);

    let user = await riderService.getRiderById(userid);

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

const viewApproved = async (req, res) => {
  let { page, limit, status, search } = req.query;
  try {
    let checkAuth = await roles.findOne({ _id: req.user.role });

    // check admin
    if (!checkAuth.username == "admin") {
      return res.json({
        status: 401,
        message: "UNAUTHORIZED, invalid credentials",
      });
    }

    let activeUsers = [];
    let blockedUsers = [];

    activeUsers = await rider.find({ approval: "accepted", isActive: true });
    blockedUsers = await rider.find({ approval: "accepted", isActive: false });

    activeUsers = helpers.paginateNew(activeUsers);
    blockedUsers = helpers.paginateNew(blockedUsers);

    return res.json({
      status: 200,
      message: "List of approved requests",
      data: { active: activeUsers, blocked: blockedUsers },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const addVehicle = async (req, res) => {
  try {
    // Validate the request body
    let schema = Joi.object({
      vehiclename: Joi.string().required(),
      vehiclenumber: Joi.string().required(),
      document: Joi.any(),
      picture: Joi.any(),
      license: Joi.any(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ status: 400, message: error.details[0].message, data: {} });
    }

    let checkUser = await riderVehicle
      .findOne({ vehiclenumber: req.body.vehiclenumber })
      .lean();
    if (checkUser) {
      return res.json({
        status: 409,
        messgae: "Already Exist Vehicle",
        data: {},
      });
    }

    // Get rider information
    let riderInfo = await rider.findOne({ _id: req.user._id });
    if (!riderInfo) {
      return res
        .status(200)
        .json({ status: 404, message: "Rider not found", data: {} });
    }
    if (riderInfo.vehicle.length >= 2) {
      return res
        .status(400)
        .json({
          status: 400,
          message: "Rider not allowed to add vehicle",
          data: {},
        });
    }

    // Handle file uploads
    if (req.files) {
      const dirOne = "public/vehicle";
      if (!fs.existsSync(dirOne)) {
        fs.mkdirSync(dirOne, { recursive: true });
      }

      const handleFileUpload = (file, fieldName) => {
        let imageName = `${Date.now()}_${file.name}`;
        let imageNameOne = `${dirOne}/${imageName}`;
        file.mv(imageNameOne, (err) => {
          if (err)
            throw new Error(`Error uploading ${fieldName}: ${err.message}`);
        });
        return `vehicle/${imageName}`;
      };

      if (req.files.document)
        value.document = handleFileUpload(req.files.document, "Document");
      if (req.files.picture)
        value.picture = handleFileUpload(req.files.picture, "Picture");
      if (req.files.license)
        value.license = handleFileUpload(req.files.license, "License");
    }

    // Create and save riderVehicle
    let vehicleData = {
      vehiclename: value.vehiclename,
      vehiclenumber: value.vehiclenumber,
      document: value.document,
      picture: value.picture,
      license: value.license,
    };

    let newVehicle = new riderVehicle(vehicleData);
    newVehicle = await newVehicle.save();

    console.log(newVehicle);
    console.log("Body data", req.body);

    await riderVehicle.findByIdAndUpdate(
      { _id: newVehicle._id },
      { $set: { riderId: riderInfo._id } },
      { new: true }
    );

    // Respond with the updated rider data
    return res
      .status(200)
      .json({
        status: 200,
        message: "Vehicle request sent successfully",
        newVehicle,
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: 500, message: error.message, data: {} });
  }
};

const viewVehicleRequest = async (req, res) => {
  let { page, limit, status, search } = req.query;
  try {
    let checkAuth = await roles.findOne({ _id: req.user.role });

    // check admin
    if (!checkAuth.username == "admin") {
      return res.json({
        status: 401,
        message: "UNAUTHORIZED, invalid credentials",
      });
    }

    let vehicleList = await riderVehicle.find({}).populate("riderId");

    vehicleList = helpers.paginateNew(vehicleList, 1, 100);

    return res.json({
      status: 200,
      message: "List of approved requests",
      data: vehicleList,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const acceptVehicle = async (req, res) => {
  let { vehicleid } = req.params;
  let { status, userid } = req.body;
  try {
    let checkAuth = await users.findOne({ _id: req.user._id });

    // check admin
    if (checkAuth.username !== "admin") {
      return res.status(401).json({
        status: 401,
        message: "UNAUTHORIZED, invalid credentials",
      });
    }

    // check user is a customer
    let checkRider = await rider.findOne({
      _id: mongoose.Types.ObjectId(userid),
    });
    if (!checkRider) {
      return res.status(404).json({
        status: 404,
        message: "Rider not found",
        data: null,
      });
    }
    if (checkRider.isActive == false) {
      return res.status(404).json({
        status: 404,
        message: "Rider not authentic to add vehicle",
        data: null,
      });
    }

    if (status) {
      // Update rider with the new vehicle ID
      await rider.findByIdAndUpdate(
        { _id: userid },
        { $push: { vehicle: vehicleid } },
        { new: true }
      );
      // Update rider with the new vehicle ID
      await riderVehicle.findByIdAndUpdate(
        { _id: vehicleid },
        { $set: { isActive: true } },
        { new: true }
      );
    } else {
      await riderVehicle.findByIdAndDelete(vehicleid);
    }

    let user = await riderService.getRiderById(userid);

    return res.status(200).json({
      status: 200,
      message: "success",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;

    // Validate the vehicleId
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid vehicle ID", data: {} });
    }

    // Find the rider and ensure the vehicle belongs to them
    let riderInfo = await rider.findOne({
      _id: req.user._id,
      vehicle: vehicleId,
    });
    if (!riderInfo) {
      return res
        .status(404)
        .json({
          status: 404,
          message: "Vehicle not found in your profile",
          data: {},
        });
    }

    // Remove the vehicle from riderVehicle model
    await riderVehicle.findByIdAndDelete(vehicleId);

    // Remove the vehicle reference from the rider's vehicle array
    await rider.findByIdAndUpdate(
      req.user._id,
      { $pull: { vehicle: vehicleId } },
      { new: true }
    );

    let data = await riderService.getRiderById(req.user._id);

    // Respond with the updated rider data
    return res
      .status(200)
      .json({ status: 200, message: "Vehicle deleted successfully", data });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: 500, message: error.message, data: {} });
  }
};

const deleteRider = async (req, res) => {
  try {
    const riderId = req.params.id;

    // Validate the riderId
    if (!mongoose.Types.ObjectId.isValid(riderId)) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid rider ID", data: {} });
    }

    // Find the rider and ensure they exist
    let riderInfo = await rider.findById(riderId);
    if (!riderInfo) {
      return res
        .status(404)
        .json({ status: 404, message: "Rider not found", data: {} });
    }

    // Remove the rider's associated vehicles from riderVehicle model
    await riderVehicle.deleteMany({ _id: { $in: riderInfo.vehicle } });

    // Remove the rider from rider model
    await rider.findByIdAndDelete(riderId);

    // Respond with success message
    return res
      .status(200)
      .json({
        status: 200,
        message: "Rider and associated vehicles deleted successfully",
        data: {},
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: 500, message: error.message, data: {} });
  }
};

const blockRider = async (req, res) => {
  let { status, userid } = req.body;
  try {
    let checkAuth = await roles.findOne({ _id: req.user.role });

    // check admin
    if (!checkAuth.username == "admin") {
      return res.json({
        status: 401,
        message: "UNAUTHORIZED, invalid credentials",
      });
    }

    // check user is a customer

    let checkRider = await rider.findOne({
      _id: mongoose.Types.ObjectId(userid),
    });
    if (!checkRider) {
      return res.json({
        status: 404,
        message: error.message,
        data: null,
      });
    }

    await rider.findByIdAndUpdate(
      {
        _id: mongoose.Types.ObjectId(userid),
      },
      {
        $set: {
          isActive: status,
        },
      },
      {
        new: true,
      }
    );

    let user = await riderService.getRiderById(userid);

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

const getRider = async (req, res) => {
  try {
    let userid = req.params.id;
    let user = await riderService.getRiderById(userid);
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

const updateRider = async (req, res) => {
  try {
    // Validate the request body
    let schema = Joi.object({
      fullname: Joi.string().required(),
      phone: Joi.string().required(),
      address: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: 400, message: error.details[0].message, data: {} });

    let updateRider = await rider.findByIdAndUpdate(
      { _id: req.user._id },
      { $set: req.body },
      { new: true }
    );

    // Retrieve the user information
    let riderData = await riderService.getRiderById(updateRider._id);

    // Respond with success
    return res
      .status(200)
      .json({ status: 200, message: "Success", data: riderData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: 500, message: error.message, data: {} });
  }
};

const nearbyOrders = async (req, res) => {
  try {
    let data = await orderService.nearByOrders({
      assignRider: null,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [req.body.longitude, req.body.latitude],
          },
          $minDistance: 0,
          $maxDistance: 1000,
        },
      },
    });
    res.status(200).json({ status: "success", message: "Nearby Orders", data });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export default {
  store,
  login,
  view,
  acceptRequest,
  viewApproved,
  addVehicle,
  viewVehicleRequest,
  acceptVehicle,
  deleteVehicle,
  deleteRider,
  blockRider,
  getRider,
  updateRider,
  nearbyOrders,
};
