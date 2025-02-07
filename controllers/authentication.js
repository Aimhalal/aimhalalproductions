import Joi from "joi";
import users from "../models/users.js";
import userService from "../services/user.js";
import helper from "../utils/helpers.js";
import helpers from "../utils/helpers.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "./user.js";
import roleService from "../services/role.js";
import fs from "fs";
import stores from "../models/stores.js";
import guest from "../models/guest.js";
import translate from "../utils/translate.js";
import path from "path";
import mongoose from "mongoose";
import savedAdress from "../models/savedAdress.js";

const login = async (req, res) => {
  try {
    let { email, password, fcmToken, fcm, type, number, login_type } = req.body;
    let vendorRequest = {};
    let schema = Joi.object({
      number: Joi.string(),
      password: Joi.string().required(),
      fcm: Joi.any(),
      type: Joi.any(),
      login_type: Joi.any(),
      email: Joi.string().when("type", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      }),
      fcmToken: Joi.any(),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    let query = {};

    if (req.body.number) {
      // Assuming req.body.number contains the number to remove
      let newStr = req.body.number.replace(/\+/g, ""); // Using a regular expression with the global flag to remove all occurrences of '+'
      number = newStr;
    }

    // !type ? query.email = email : query.number = number;
    if (!type) {
      query.email = email;
    } else {
      if (login_type != "number") {
        query.email = number;
      } else {
        query.number = number;
      }
    }

    let checkUser = await users.findOne(query).lean();
    if (!checkUser) {
      return res.json({
        status: 409,
        messgae: "Invalid Account",
        data: {},
      });
    }

    // check if user is a customer

    let checkRole = await roleService.getRoleById(checkUser.role);

    const isPassword = await bcrypt.compare(password, checkUser.password);

    // const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(200).json({
        status: 400,
        message: "Invalid Password",
        data: null,
      });
    }

    // customer should not be able to login in as  a vendor

    if (!login_type) {
      if (checkUser.isCustomer) {
        if (!checkUser.isVendor) {
          vendorRequest = {
            isVendor: checkUser.isVendor,
          };
          return res.status(200).json({
            status: 200,
            message: "you are a customer, please register yourself as a vendor",
            data: checkUser,
            vendorRequest: {
              isVendor: checkUser.isVendor,
              isVendorRequest: checkUser.isvendorRequest,
            },
          });
        }
      }
      // if(checkUser.isStoreBlocked)
      // {
      //     return res.status(200).json({
      //         status: 400,
      //         message: "Your store has been blocked by the admin",
      //         data: null,
      //             })
      // }

      // if(checkRole.name == 'user')
      // {
      //     return res.status(200).json({
      //         status: 400,
      //         message: "Only vendors are allowed",
      //         data: null,
      //     })
      // }
    }

    if (checkRole.name == "user") {
      if (!checkUser.isActive) {
        return res.status(200).json({
          status: 400,
          message: "user blocked by administration, please contact support ",
          data: null,
        });
      }
    }
    // add a jwtToken

    const token = jwt.sign(
      { id: checkUser._id, username: checkUser.username },
      process.env.JWT_SECRET
    );
    await users.findByIdAndUpdate(
      { _id: checkUser._id },
      {
        $set: {
          verificationToken: token,
          fcmToken,
        },
      }
    );

    // get user information from the helper
    let data = await userService.getUserById(checkUser._id);

    // check is store is Available
    let checkStore = await stores.findOne({ user: checkUser._id });
    data.isAvailable = false;

    if (checkStore) {
      data.isAvailable = checkStore.isAvailable;
    }

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
const guestLogin = async (req, res) => {
  try {
    let { deviceId } = req.body;
    let schema = Joi.object({
      deviceId: Joi.string(),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    let query = {};

    // guest login

    let guestLogin = new guest({
      device_id: deviceId,
    });
    guestLogin = await guestLogin.save();
    let user;

    user = await users.findOne({
      deviceId: deviceId,
    });

    if (!user) {
      user = new users({
        deviceId,
        type: "guest",
      });
      user = await user.save();
    }

    // add a jwtToken

    const token = jwt.sign(
      { id: user._id, username: "guest" },
      process.env.JWT_SECRET
    );
    await users.findByIdAndUpdate(
      { _id: user._id },
      {
        $set: {
          verificationToken: token,
        },
      }
    );

    // get user information from the helper
    let data = await userService.getUserById(user._id);

    // check is store is Available
    let checkStore = await stores.findOne({ user: user._id });
    data.isAvailable = false;

    if (checkStore) {
      data.isAvailable = checkStore.isAvailable;
    }

    return res.json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      status: 500,
      message: "An unexpected error occurred while proceeding your request.",
      data: null,
      trace: error.message,
    });
  }
};

const adminUser = async (req, res) => {
  let { type, username, number, email, role, country, otp_type } = req.body;

  try {
  } catch (error) {}
};

const store = async (req, res) => {
  let { type, username, number, email, role, country, otp_type } = req.body;
  // console.log("yes here")
  try {
    // validate the requests
    let otpNumber = number;
    let schema = Joi.object({
      username: Joi.string().required(),
      number: Joi.string().required(),
      email: Joi.string().required(),
      role: Joi.string().required(),
      country: Joi.string().required(),
      type: Joi.any(),
      types: Joi.any(),
      otp_type: Joi.any(),
      password: Joi.any(),
      fcmToken: Joi.any(),
      confirm_password: Joi.string().when("password", {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      document: Joi.any(),
      customer: Joi.any(),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });
    // check if already exists
    if (req.body.types) {
      req.body.type = req.body.types;
    }
    if (req.body.number) {
      // Assuming req.body.number contains the number to remove
      let newStr = req.body.number.replace(/\+/g, ""); // Using a regular expression with the global flag to remove all occurrences of '+'
      req.body.number = newStr;
    }

    let checkUser = await userService.userAlreadyExist(email);
    if (checkUser?._id.toString() != req.body.customer) {
      if (checkUser)
        return res.json({
          status: 409,
          message: "Email or Phone number is already in used",
          data: {},
        });
      let checkUserNumber = await userService.userExist(req.body.number);
      if (checkUserNumber)
        return res.json({
          status: 409,
          message: "Email or Phone number is already in used",
          data: {},
        });

      if (checkUser?.isvendorRequest) {
        return res.json({
          status: 500,
          message: "You vendor request has already been submitted",
          data: {},
        });
      }
    }
    // get user role
    let findRole = await roleService.getRoleByName(role);

    // console.log(findRole);
    // return res.json(findRole)

    req.body.role = findRole._id;

    // check if document is uploaded

    if (req.files) {
      let document = req.files.document;

      const dirOne = "public/certification";

      if (document) {
        // Check if the file is one of the allowed types
        const allowedTypes = [".jpg", ".png", ".pdf"];
        const fileExtension = path.extname(document.name).toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
          return res.status(400).json({
            status: 400,
            message: "Certificate can only be JPG, PNG or PDF",
            data: {},
          });
        }

        let imageName = `${Date.now()}_${document.name}`;
        let imageNameOne = `${dirOne}/` + imageName;

        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }

        document.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(400).json({
              status: 400,
              message: error.message,
              data: "",
            });
          }
        });

        req.body.document = `certification/${imageName}`;
      }
    }

    // translate user

    // send an email to the admin, for new vendor registration
    let otp = Math.floor(1000 + Math.random() * 9000);

    let data;
    if (findRole.name == "user" && !req.body.customer) {
      req.body.isCustomer = true;
      if (otp_type == "number") {
        let otpResponse = await helper.sendTwilioOtp(otp, otpNumber);
        if (otpResponse?.sid) {
          console.log(otpResponse?.sid);
          data = new users(req.body);
          data = await data.save();

          await translate.translateText(data, "user");

          await users.findByIdAndUpdate(
            {
              _id: data._id,
            },
            {
              $set: {
                otp,
              },
            }
          );
        } else {
          return res.json({
            status: 500,
            message: "Something went wrong",
            data: {},
          });
        }
      } else {
        data = new users(req.body);
        data = await data.save();

        await translate.translateText(data, "user");

        await helper.sendOtp(data.email, otp, "registration");
      }

      // update user information
      let pass = await bcrypt.hash(req.body.password, 10);

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
    } else {
      if (req.body.customer) {
        data = await users.findByIdAndUpdate(
          {
            _id: req.body.customer,
          },
          {
            $set: {
              isvendorRequest: true,
              status: "pending",
              role: mongoose.Types.ObjectId("659402c400228e9c878cbe2c"),
            },
          },
          { new: true }
        );
      } else {
        data = new users(req.body);
        data = await data.save();
      }
      // req.body.isvendorRequest = true;

      await helper.sendVendorRequest(data.email);
    }

    // retrive user information from the route

    data = await userService.getUserById(data._id);

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
const requestForgetPassword = async (req, res) => {
  let { email } = req.body;
  try {
    let checkUser = await users.findOne({
      email,
    });
    if (!checkUser)
      return res.json({ status: 404, message: "user not found", data: {} });

    // send otp to the user email

    let otp = Math.floor(1000 + Math.random() * 9000);

    // helpers.sendResetPasswordEmail(otp,req.body.email,"Abdul Maroof");
    await helpers.sendOtp(email, otp);

    await users.findByIdAndUpdate(
      {
        _id: checkUser._id,
      },
      {
        $set: {
          otp,
        },
      }
    );

    // // get user information from the helper

    // let data = await userService.getUserById(checkUser._id)

    return res.json({
      status: 200,
      message: "otp has been sent to your email!",
      data: {},
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const verifyOtp = async (req, res) => {
  let { email, otp, type, otp_type } = req.body;
  try {
    // get user details using OTP

    let checkUser;

    if (otp_type == "number") {
      checkUser = await users.findOne({ number: email });
    } else {
      checkUser = await users.findOne({ email });
    }

    if (!checkUser) {
      return res.json({
        status: 404,
        message: "Invalid User",
        data: {},
      });
    }

    if (checkUser.otp == otp) {
      const token = jwt.sign(
        { id: checkUser._id, username: checkUser.username },
        process.env.JWT_SECRET
      );

      checkUser = await users.findByIdAndUpdate(
        {
          _id: checkUser._id,
        },
        {
          $set: {
            isActive: true,
            status: "accepted",
            verificationToken: token,
          },
        }
      );

      checkUser = await userService.getUserById(checkUser._id);

      return res.json({
        status: 200,
        message: "success otp verified",
        data: checkUser,
      });
    }

    return res.json({
      status: 500,
      message: "Invalid Otp",
      data: {},
    });

    // check otp type

    // if(otp_type == 'number')
    // {
    //     // check with Vonage Api

    //     let otpResponse = await helper.verifyOtpVonage(email,otp,checkUser?.request_id)
    //     if(!otpResponse.error_text)
    //     {
    //         await users.findByIdAndUpdate({
    //             _id:checkUser._id
    //         },{
    //             $set : {
    //                 isActive : true,
    //                 status : 'accepted'
    //             }
    //         })

    //         return res.json({
    //             status : 200,
    //             message : "otp successfully verified",
    //             data : {}
    //         })
    //     }

    // }
    // else
    // {
    //     if( checkUser.otp == otp)
    //     {
    //         await users.findByIdAndUpdate({
    //             _id:checkUser._id
    //         },{
    //             $set : {
    //                 isActive : true,
    //                 status : 'accepted'
    //             }
    //         })

    //         return res.json({
    //             status : 200,
    //             message : "otp successfully verified",
    //             data : {}
    //         })
    //     }

    //     return res.json({
    //         status : 500,
    //         message : "Invalid Otp",
    //         data : {}
    //     })

    // }

    // // let data = await users.findOne({
    // //     email,
    // //     otp
    // // })
    // // if(!data) return res.json({
    // //     status : 404,
    // //     message : "Invalid Request",
    // //     data
    // // })

    // //
    // if(type == 'user')
    // {

    //     await users.findByIdAndUpdate({
    //         _id:data._id
    //     },{
    //         $set : {
    //             isActive : true,
    //             status : 'accepted'
    //         }
    //     })
    // }
    // // get user data
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const resendOtp = async (req, res) => {
  let { email, number, otp_type } = req.body;
  let otpNumber = number;
  try {
    if (req.body.number) {
      // Assuming req.body.number contains the number to remove
      let newStr = req.body.number.replace(/\+/g, ""); // Using a regular expression with the global flag to remove all occurrences of '+'
      req.body.number = newStr;
      console.log(newStr); // Out
    }

    let otp = Math.floor(1000 + Math.random() * 9000);

    let checkUser = await users.findOne({
      email: email,
      number: req.body.number,
    });

    if (!checkUser) {
      return res.json({
        status: 500,
        message: "No user found",
        data: {},
      });
    }

    if (otp_type == "number") {
      let respons = await helper.sendTwilioOtp(otp, otpNumber);
      if (respons.sid) {
        await users.findByIdAndUpdate(
          {
            _id: checkUser._id,
          },
          {
            $set: {
              otp,
            },
          }
        );
      } else {
        return res.json({
          status: 500,
          message: "error with your registration number",
          data: {},
        });
      }
    } else {
      //    let otpResp = await users.findByIdAndUpdate

      await users.findByIdAndUpdate(
        {
          _id: checkUser._id,
        },
        {
          $set: {
            otp: otp,
          },
        }
      );

      await helper.sendOtp(checkUser.email, otp, "registration");
    }

    return res.json({
      status: 200,
      message: "success",
      data: {},
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const changePassword = async (req, res) => {
  let { email, password, confirmPassword } = req.body;
  try {
    let newPass = req.body.password;

    const schema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
        }),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.message,
        data: {},
      });

    let checkUser = await users.findOne({
      email,
    });
    if (!checkUser)
      return res.json({
        status: 404,
        message: "success",
        data: checkUser,
      });

    password = await bcrypt.hash(password, 10);

    await users.findByIdAndUpdate(
      { _id: checkUser._id },
      {
        $set: {
          password,
        },
      },
      {
        new: true,
      }
    );

    if (password) {
      await helpers.updateSettingPassword(email, newPass);
    }

    return res.json({
      status: 200,
      message: "password updated",
      data: {},
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// user profile update

const profile = async (req, res) => {
  let { _id } = req.user;
  try {
    // check if user already exisit in the system
    let data = await userService.getUserById(_id);
    if (!data)
      return res.json({
        status: 400,
        message: "user not found",
        data: {},
      });

    // profile information

    if (req.files) {
      let picture = req.files.picture;
      const dirOne = "public/profile";
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

        req.body.picture = `profile/${imageName}`;
      }
    }

    // update user information

    await users.findByIdAndUpdate(
      {
        _id,
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    data = await userService.getUserById(_id);

    return res.json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    return res.json({
      status: error.message,
    });
  }
};

const destroy = async (req, res) => {
  try {
    let deleteUser = await users.findOneAndDelete({
      _id: req.user._id,
    });

    return res.json({
      status: 200,
      message: "deleted successfully",
      data: {},
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// user app change password

const changePasswordRequest = async (req, res) => {
  let { type, number } = req.body;
  try {
    let data;
    if (type == "email") {
      data = await users.findOne({
        email: number,
      });
    } else {
      if (req.body.number) {
        // Assuming req.body.number contains the number to remove
        let newStr = req.body.number.replace(/\+/g, ""); // Using a regular expression with the global flag to remove all occurrences of '+'
        req.body.number = newStr;
      }

      data = await users.findOne({
        number: req.body.number,
      });
    }

    if (!data) {
      return res.json({
        status: 404,
        message: "User not found",
        data: {},
      });
    }

    return res.json({
      status: 200,
      message: "success",
      data: {},
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const changePasswordVerify = async (req, res) => {
  let { type, number } = req.body;
  try {
    let schema = Joi.object({
      type: Joi.string().required(),
      number: Joi.string().required(),
      password: Joi.required(),
      confirmPassword: Joi.string().when("password", {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    let data;
    if (type == "email") {
      data = await users.findOne({
        email: number,
      });
    } else {
      if (req.body.number) {
        // Assuming req.body.number contains the number to remove
        let newStr = req.body.number.replace(/\+/g, ""); // Using a regular expression with the global flag to remove all occurrences of '+'
        req.body.number = newStr;
      }
      data = await users.findOne({
        number: req.body.number,
      });
    }

    if (!data) {
      return res.json({
        status: 404,
        message: "User not found",
        data: {},
      });
    }

    // update user password
    let password = await bcrypt.hash(req.body.password, 10);

    data = await users.findByIdAndUpdate(
      {
        _id: data._id,
      },
      {
        $set: {
          password,
        },
      }
    );

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

const saveAddress = async (req, res) => {
  let { userId, address } = req.body;
  let updatedData;
  try {
    let data = await users.findOne({
      _id: userId,
    });
    if (!data)
      return res.json({
        status: 404,
        message: "User not found",
        data: {},
      });

    let savedAddress = await savedAdress.findOne({
      userId: userId,
    });

    if (savedAddress) {
      updatedData = await savedAdress.findByIdAndUpdate(
        {
          _id: savedAddress._id,
        },
        {
          $push: {
            address,
          },
        }
      );
    } else {
      updatedData = await savedAdress.create({
        userId: userId,
        address,
      });
    }

    return res.json({
      status: 200,
      message: "success",
      data: updatedData,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const getAddress = async (req, res) => {
  let { userId } = req.params;
  try {
    let data = await savedAdress.findOne({
      userId: userId,
    });
    if (!data)
      return res.json({
        status: 404,
        message: "User not found",
        data: {},
      });

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

// user app change password
export default {
  // Admin user
  adminUser,
  // Ending Admin User

  store,
  login,
  requestForgetPassword,
  verifyOtp,
  resendOtp,
  changePassword,
  all,

  // user app profile update
  profile,
  guestLogin,

  destroy,

  // user profile update Ending Here

  changePasswordRequest,
  changePasswordVerify,

  // App
  saveAddress,
  getAddress,

  // End App
};
