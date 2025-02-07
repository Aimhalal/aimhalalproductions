//  vendor routes

import Joi from "joi";
import stores from "../models/stores.js";
import storeServices from "../services/store.js";
import vendorService from "../services/role.js";

import users from "../models/users.js";
import items from "../models/items.js";
import order from "../models/order.js";
import category from "../models/category.js";
import bcrypt from "bcrypt";
import helpers from "../utils/helpers.js";
import favourite from "../models/favourite.js";
import translate from "../utils/translate.js";
import Promotion from "../models/promotion.js";
import axios from "axios";
import promotion from "../services/promotion.js";
import storeCategory from "../models/storeCategory.js";
import role from "../services/role.js";
import fs from "fs";
import path from "node:path";
import { dirname } from "path";

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
      isHalal: Joi.any(),
      disclaimerform: Joi.any(),
      types: Joi.any(),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

    // Get user types

    let checkCategoryforHalalWeb = await role.checkHalalWebCategory(
      req.user.type
    );

    if (checkCategoryforHalalWeb?.group == "Halal Web") {
      if (!req.body.area) {
        return res.json({
          status: 400,
          message: "Address is mandatory",
          data: {},
        });
      }
    }

    // check store alreay exisits

    let checkStore = await storeServices.checkStoreAlreadyExist(req.body);
    if (checkStore)
      return res.json({
        status: 409,
        message: "store already exist you can not create store with same name",
        data: {},
      });

    // get userid

    req.body.user = req.user._id;
    req.body.types = req.user.type;

    req.body.opening_hours = JSON.parse(req.body.opening_hours, true);

    // upload files to the store

    if (req.files) {
      let banner = req.files.banner;
      let logo = req.files.logo;
      let disclaimer = req.files.disclaimerform;
      const dirOne = "public/store";
      let imageNameOne;
      let mainImage;
      if (banner) {
        mainImage = `${Date.now()}_` + banner.name;
        imageNameOne = `${dirOne}/${mainImage}`;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        banner.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              error: error.message,
              data: "",
            });
          }
        });

        req.body.banner = `store/${mainImage}`;
      }

      if (logo) {
        mainImage = `${Date.now()}_` + logo.name;
        imageNameOne = `${dirOne}/${mainImage}`;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        logo.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              error: error.message,
              data: "",
            });
          }
        });

        req.body.logo = `store/${mainImage}`;
      }

      if (disclaimer) {
        mainImage = `${Date.now()}_` + disclaimer.name;
        imageNameOne = `${dirOne}/${mainImage}`;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        disclaimer.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              error: error.message,
              data: "",
            });
          }
        });

        req.body.disclaimerform = `disclaimer/${mainImage}`;
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
        _id: req.body.user,
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

    return res.json({
      status: 200,
      message: "success",
      data: store,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const myStore = async (req, res) => {
  let { store } = req.user;
  try {
    // Fetch store information
    const storeData = await stores.findById({ _id: store._id });

    // Fetch reviews for the store
    const reviews = await items
      .find({ store: store._id })
      .populate("review.customer")
      .exec();

    // Calculate total orders (assuming you have an "order" model)
    const totalOrders = await order.countDocuments({ store: store._id }).exec();

    // Fetch initial products
    const initialProducts = await items
      .find({ store: store._id })
      .limit(10)
      .exec();

    // Fetch category-wise data

    const categories = await category
      .find({
        "default_stores.store": store._id,
      })
      .exec();

    const categoryWiseData = await Promise.all(
      categories.map(async (category) => {
        const productsInCategory = await items
          .find({ category: category._id, store: store._id })
          .exec();

        return {
          name: category.name,
          products: productsInCategory,
          _id: category._id,
        };
      })
    );

    return res.json({
      status: 200,
      message: "success",
      data: {
        store: storeData,
        reviews,
        totalOrders,
        initialProducts,
        categorWiseData: categoryWiseData,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    // check if store already exisit in store
    let checkStore = await storeServices.getStoreById(req.user.store._id);
    if (!checkStore)
      return res.json({ status: 404, message: "success", data: {} });

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

      const mobile_bannerBuffer = req.files.logo.data;
      let mobile_bannerBufferResponse = await helpers.storeImageWithValidation(
        mobile_bannerBuffer
      );

      console.log(mobile_bannerBufferResponse);

      if (
        picture &&
        (mobile_bannerBufferResponse.width !== 180 ||
          mobile_bannerBufferResponse.height !== 180)
      ) {
        return res.status(200).json({
          status: 400,
          message:
            "Invalid banner dimensions for Logo. Logo size should be exactly 180x180 pixels.",
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
              error: error.message,
              data: "",
            });
          }
        });

        req.body.logo = `store/${imageName}`;
      }
    }

    await stores.findByIdAndUpdate(
      {
        _id: req.user.store._id,
      },
      {
        $set: {
          logo: req.body.logo,
        },
      }
    );

    // get store information

    let data = await storeServices.getStoreById(req.user.store._id);

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

const updateStoreProfile = async (req, res) => {
  try {
    let schema = Joi.object({
      store_name: Joi.string(),
      aboutus: Joi.string(),
      store_url: Joi.any(),
      opening_hours: Joi.string(),
      banner: Joi.any(),
      logo: Joi.any(),
      zone: Joi.any(),
      area: Joi.any(),
      longitude: Joi.any(),
      latitude: Joi.any(),
      slug: Joi.any(),
    });
    const { error, value } = schema.validate(req.body);
    if (error)
      return res.json({ status: 400, message: error.message, data: {} });

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

        const mobile_bannerBuffer = req.files.banner.data;
        let mobile_bannerBufferResponse =
          await helpers.storeImageWithValidation(mobile_bannerBuffer);

        if (
          banner &&
          (mobile_bannerBufferResponse.width !== 1600 ||
            mobile_bannerBufferResponse.height !== 325)
        ) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid Banner dimensions. Banner size should be exactly 1600X325 pixels.",
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
              error: error.message,
              data: "",
            });
          }
        });

        req.body.banner = `store/${mainImage}`;
      }

      if (logo) {
        logo.name = logo.name.replace(/\s+/g, "_"); // Replace all whitespace characters with underscores

        const mobilelogo = req.files.logo.data;
        let mobileLogoR = await helpers.storeImageWithValidation(mobilelogo);

        if (logo && (mobileLogoR.width !== 180 || mobileLogoR.height !== 180)) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid logo dimensions. logo size should be exactly 180X180 pixels.",
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
              error: error.message,
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
        coordinates: [location.lat, location.lng],
      };

      req.body.latitude = location.lat;
      req.body.longitude = location.lng;

      req.body.location = newLocation;
    }

    await stores.findByIdAndUpdate(
      {
        _id: req.user.store._id,
      },
      {
        $set: req.body,
      }
    );

    let store = await storeServices.getStoreById(req.user.store._id);

    return res.json({
      status: 200,
      message: "success",
      data: store,
    });
  } catch (error) {
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
      let newPass = req.body.password;
      req.body.password = await bcrypt.hash(req.body.password, 10);
      req.body.isAdmin = false;

      await helpers.updateSettingPassword(req.user.email, newPass);
    }

    if (req.body.confirm_password) {
      delete req.body.confirm_password;
    }

    //

    let data = await users.findByIdAndUpdate(
      {
        _id: req.user._id,
      },
      {
        $set: req.body,
      }
    );

    await stores.findByIdAndUpdate(
      {
        _id: req.user.store._id,
      },
      {
        $set: {
          isAdmin: false,
        },
      }
    );
    // get user information

    data = await storeServices.getStoreById(req.user.store._id);

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

// Home Page Single Store View

const singleStoreView = async (req, res) => {
  let { type } = req.params;
  type = type.toLowerCase();
  try {
    let regexType = new RegExp(type, "i"); // 'i' flag makes the regex case-insensitive

    let query = {
      types: regexType,
    };

    let data = await storeServices.nearByStores(query);

    data = await Promise.all(
      await data.map(async (e) => {
        return await storeServices.getStoreById(e._id);
      })
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

const availability = async (req, res) => {
  let { _id } = req.user.store;
  let { isAvailable } = req.body;
  try {
    let data = await stores.findByIdAndUpdate(
      {
        _id,
      },
      {
        $set: {
          isAvailable,
        },
      },
      {
        new: true,
      }
    );

    data = await storeServices.getStoreById(data._id);

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

// Ending Store Section

// app store section

const categoryWiseStores = async (req, res) => {
  try {
    let category = await vendorService.getVendorTypes();
    category = await Promise.all(
      category.map(async (e) => {
        let query = {
          types: {
            $in: e.name,
          },
        };

        // get stores information
        let storeInfo = await helpers.paginate(stores, query);
        storeInfo = storeInfo.data;
        if (storeInfo.length) {
          storeInfo = await Promise.all(
            storeInfo.map(async (store) => {
              return await storeServices.getStoreById(store._id, req.user._id);
            })
          );
        }
        e.stores = storeInfo;
        return e;
      })
    );
    return res.json({
      status: 200,
      message: "success",
      data: category,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const allHalalWeb = async (req, res) => {
  try {
    let halalCats = await storeCategory.find({
      group: "Halal Web",
    });

    return res.json({
      status: 200,
      messaeg: "success",
      data: halalCats,
    });
  } catch (error) {
    return res.json({
      status: 500,
      messaeg: error.messaeg,
      data: {},
    });
  }
};

// Works

const getSingleStore = async (req, res) => {
  let { id } = req.params;
  let forYou = []; // product with top reviews
  let popular = []; // best selling products
  try {
    // check if stores
    let checkStore = await stores.findById({
      _id: id,
    });
    if (!checkStore)
      return res.json({
        status: 500,
        message: "store not found",
        data: {},
      });

    let store = await storeServices.getStoreById(id, req.user._id);
    store.promotions = await promotion.nearByPromotions({
      store: id,
    });

    store.allCategories = await category
      .find({ "default_stores.store": id })
      .select({ name: 1 })
      .lean();
    // get product data using categorywise

    store.allCategories = await Promise.all(
      store.allCategories.map(async (e) => {
        let products = await items
          .find({
            category: { $in: e._id },
            store: id,
          })
          .populate({
            path: "user",
            select: {
              username: 1,
              email: 1,
              number: 1,
              address: 1,
            },
          })
          .populate({
            path: "category",
          })
          .populate({
            path: "other",
          })
          .limit(10)
          .lean();

        // check favourites

        products = await Promise.all(
          products.map(async (p) => {
            let checkFav = await favourite.findOne({
              item: p._id,
              user: req.user._id,
            });
            p.isFavourite = checkFav ? true : false;

            let proData = await promotion.getPromotionItems(p._id);
            if (proData) {
              e.price = proData.price;
              e.discount = 0;
              e.discounted_price = 0;
              e.discount_percentage = 0;
              e.pictures = [proData.banner];
            }

            return p;
          })
        );

        e.products = products;
        return e;
      })
    );

    // // for you and popular data inside

    forYou = await helpers.paginate(
      items,
      {
        store: id,
      },
      [
        {
          path: "user",
          select: { username: 1, email: 1, number: 1, address: 1 },
        },
        { path: "category" },
        { path: "other" },
      ]
    );

    // // add Favourites

    // let newData = forYou.data;

    // newData = await Promise.all(newData.map( async (e) =>{
    //     let checkFav = await favourite.findOne({
    //         item : e._id,
    //         user : req.user._id
    //     })
    //     e.isFavourite = checkFav?true:false;
    //     return e;
    // }))

    // store.allCategories.push({
    //     _id : '1',
    //     name : "For You",
    //     products : [],
    //     topReviewed : newData,
    //     bestSelling : newData
    // })

    return res.json({
      status: 200,
      message: "success",
      data: store,
      pagination: forYou.pagination,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

// ending app store section

// Admin Partner Section

const removeStore = async (req, res) => {
  try {
    let isActive = false;

    let checkStore = await stores.findById({ _id: req.params.id });
    if (!checkStore.isActive) {
      isActive = true;
    }

    await stores.findByIdAndUpdate(
      {
        _id: req.params.id,
      },
      {
        $set: {
          isActive,
        },
      }
    );

    // remove users from the store

    await users.findOneAndDelete({
      store: req.params.id,
    });
    await helpers.activityLog({
      adminId: req.user._id,
      action: `has Blocked  a  Store ${checkStore?.store_name}`,
    });

    return res.json({
      status: 200,
      message: "success",
      data: [],
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const allPartners = async (req, res) => {
  let { search, page } = req.query;
  let query = {};
  let adminQuery = {}; // Separate query for admin-created stores
  let websiteQuery = {}; // Separate query for website-created stores

  try {
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { store_name: regex },
        { aboutus: regex },
        { types: regex },
        { store_url: regex },
        { zone: regex },
        { area: regex },
        { "opening_hours.day": regex },
      ];

      // Set the same search criteria for adminQuery and websiteQuery
      adminQuery = { ...query };
      websiteQuery = { ...query };
    }

    // Add additional criteria for admin-created stores
    adminQuery.isAdmin = true;
    adminQuery.isActive = true;
    websiteQuery.isAdmin = false;
    websiteQuery.isActive = true;

    let adminCreatedStoresData = await helpers.paginate(
      stores,
      adminQuery,
      [],
      {},
      page,
      20
    );
    let websiteCreatedStoresData = await helpers.paginate(
      stores,
      websiteQuery,
      [],
      {},
      page,
      20
    );
    let blockedStoreData = await helpers.paginate(
      stores,
      { isActive: false },
      [],
      {},
      page,
      20
    );

    // Combine the results from both sets of stores
    let adminCreatedStoresWithTopProducts = await Promise.all(
      adminCreatedStoresData.data.map(async (e) => {
        e.topProducts = [];
        return e;
      })
    );

    let websiteCreatedStoresWithTopProducts = await Promise.all(
      websiteCreatedStoresData.data.map(async (e) => {
        e.topProducts = [];
        return e;
      })
    );

    // Combine both sets of stores for pagination adjustment
    // let totalDocs =
    // (adminCreatedStoresData.pagination.totalLength || 0) +
    // (websiteCreatedStoresData.pagination.totalLength || 0);
    // console.log('Admin Total Docs:', adminCreatedStoresData.pagination.totalDocs);
    // console.log('Website Total Docs:', websiteCreatedStoresData.pagination.totalDocs);        // let pagination = {
    //     currentPage: page,
    //     totalPages: Math.ceil(totalDocs / 20), // Assuming 20 records per page
    //     totalLength: totalDocs
    // };

    let totalDocs = Math.max(
      adminCreatedStoresData.pagination.totalLength || 0,
      websiteCreatedStoresData.pagination.totalLength || 0
    );

    let totalPages = Math.ceil(totalDocs / 20); // Assuming 20 records per page

    // Adjust page number if it exceeds the available data
    if (page > totalPages) {
      page = totalPages;
    }

    // let pagination = {
    //     currentPage: page,
    //     totalPages: totalPages,
    //     totalLength: totalDocs
    // };

    let pagination = {
      currentPage: page ? page : 1,
      totalPages: Math.ceil(totalDocs / 20), // Assuming 20 records per page
      totalLength: totalDocs,
    };

    return res.json({
      status: 200,
      message: "success",
      data: adminCreatedStoresWithTopProducts,
      websiteCreatedStores: websiteCreatedStoresWithTopProducts,
      blocked: blockedStoreData.data,
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

const getSinglePartner = async (req, res) => {
  let { id } = req.params;
  try {
    let data = await storeServices.getOverallStore(id);
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

// Ending Partner Section

// Website

const getStoreById = async (req, res) => {
  let { slug, type } = req.params;
  let query = {};
  try {
    type == "id" ? (query._id = slug) : (query.slug = slug);
    let getStoreBySlug = await stores.findOne(query);
    if (!getStoreBySlug) {
      return res.json({
        status: 404,
        message: "slug not found",
        data: {},
      });
    }

    let store = await storeServices.getStoreById(getStoreBySlug._id);

    store.products = await items
      .find({
        store: getStoreBySlug._id,
      })
      .populate({
        path: "user",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .populate({
        path: "category",
      })
      .populate({
        path: "other",
      })
      .limit(10)
      .lean();

    return res.json({
      status: 200,
      message: "success",
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

const convertDataToImage = async (req, res) => {
  let update = {};
  try {
    // Validate the request body
    let schema = Joi.object({
      name: Joi.string().required(),
      dataUrl: Joi.any(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new Error(error.details[0].message);
    }

    // Handle file uploads
    if (req.files) {
      const dirOne = "public/store";
      if (!fs.existsSync(dirOne)) {
        fs.mkdirSync(dirOne, { recursive: true });
      }

      const handleFileUpload = (file, fieldName) => {
        const allowedTypes = [".jpg", ".jpeg", ".png", ".pdf"];
        const fileExtension = path.extname(file.name).toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
          throw new Error(`${fieldName} can only be JPG, PNG, or PDF`);
        }
        let imageName = `${Date.now()}_${file.name}`;
        let imageNameOne = `${dirOne}/${imageName}`;
        file.mv(imageNameOne, (err) => {
          if (err)
            throw new Error(`Error uploading ${fieldName}: ${err.message}`);
        });
        return `vehicle/${imageName}`;
      };

      if (req.files.dataUrl) {
        value.dataUrl = handleFileUpload(req.files.dataUrl, "dataUrl");
      }
    }

    if (req.body.name === "banner") {
      update.banner = value.dataUrl;
    } else {
      update.logo = value.dataUrl;
    }

    console.log(update);

    await stores.findByIdAndUpdate(
      { _id: req.user.store._id },
      { $set: update },
      { new: true }
    );

    let newStoreInfo = await storeServices.getStoreById(req.user.store._id);
    return res.json({
      status: 200,
      message: "success",
      data: newStoreInfo,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// Ending Website

export default {
  store,
  myStore,
  updateProfile,
  updateStoreProfile,
  updateSettings,
  singleStoreView,
  availability,
  categoryWiseStores,
  allHalalWeb,
  getSingleStore,

  removeStore,

  // get reviews

  // Admin Partner Routes

  allPartners,
  getSinglePartner,
  // Admin partner routes

  // Web routes

  getStoreById,

  // ending Web Routes

  convertDataToImage,
};
