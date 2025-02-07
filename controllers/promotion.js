import Joi from "joi";
import promotion from "../models/promotion.js";
import fs from "fs";
import helpers from "../utils/helpers.js";
import promotionService from "../services/promotion.js";
import items from "../models/items.js";
import stores from "../models/stores.js";
import Banner from "../models/banner.js";
import banner from "../models/banner.js";

// customer Order Section

const update = async (req, res) => {
  let { type } = req.body;
  let { id } = req.params;
  try {
    if (req.body.delivery_types) {
      req.body.delivery_types = req.body.delivery_types.split(",");
    }

    req.body.store = req.user.store._id;

    // check type

    if (!type) {
      req.body.type = "store";
      req.body.item = req.user.store._id;
    }

    if (req.files) {
      let banner = req.files.banner;

      banner.name = banner.name.replace(/\s+/g, "_"); // Replace all whitespace characters with underscores

      const mobile_logo = req.files.banner.data;
      let mobile_logoResponse = await helpers.storeImageWithValidation(
        mobile_logo
      );

      if (
        banner &&
        (mobile_logoResponse.width !== 330 ||
          mobile_logoResponse.height !== 174)
      ) {
        return res.status(200).json({
          status: 400,
          message:
            "Invalid Promotion dimensions. Logo size should be exactly 330X174 pixels.",
          data: "",
        });
      }

      const dirOne = "public/promotion";
      let imageNameOne;
      if (banner) {
        let imageName = `${Date.now()}_${banner.name}`;
        imageNameOne = `${dirOne}/` + imageName;
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

        req.body.banner = `promotion/${imageName}`;
      }
    }

    if (req.body.duration) {
      let deadline = await promotionService.setDuration(
        req.body.duration,
        req.body.startDate
      );

      req.body.endDate = deadline.deadlineDate;
    }

    let data = await promotion.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    // update user information

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

const store = async (req, res) => {
  let { type } = req.body;
  try {
    if (req.body.delivery_types) {
      req.body.delivery_types = req.body.delivery_types.split(",");
    }

    req.body.store = req.user.store._id;

    // check type

    if (!type) {
      req.body.type = "store";
      req.body.item = req.user.store._id;
    }

    if (req.files) {
      let banner = req.files.banner;

      banner.name = banner.name.replace(/\s+/g, "_"); // Replace all whitespace characters with underscores

      const mobile_logo = req.files.banner.data;
      let mobile_logoResponse = await helpers.storeImageWithValidation(
        mobile_logo
      );

      if (
        banner &&
        (mobile_logoResponse.width !== 330 ||
          mobile_logoResponse.height !== 174)
      ) {
        return res.status(200).json({
          status: 400,
          message:
            "Invalid Promotion dimensions. Logo size should be exactly 330X174 pixels.",
          data: "",
        });
      }

      const dirOne = "public/promotion";
      let imageNameOne;
      if (banner) {
        let imageName = `${Date.now()}_${banner.name}`;
        imageNameOne = `${dirOne}/` + imageName;
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

        req.body.banner = `promotion/${imageName}`;
      }
    }

    if (req.body.duration) {
      let deadline = await promotionService.setDuration(
        req.body.duration,
        req.body.startDate
      );

      req.body.endDate = deadline.deadlineDate;
    }

    let data = new promotion(req.body);
    data = await data.save();

    // update user information

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
  let query = {};
  try {
    // adjust query based on promotion id

    query.store = req.user.store._id;
    query.type = "item";

    // get store information

    let data = await helpers.paginate(promotion, query);
    let result = data.data;

    result = await Promise.all(
      result.map(async (e) => {
        e.itemData = await items.findById(e.item).lean();
        return e;
      })
    );

    let pagination = data.pagination;

    // update user information

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
      data: {},
    });
  }
};

// Admin Banners

const adminStoreBanner = async (req, res) => {
  let { store } = req.body;
  try {
    if (req.files) {
      let banner = req.files.banner;
      const dirOne = "public/promotion";
      let imageNameOne;

      if (banner) {
        const bannerBuffer = req.files.banner.data;

        let mobile_bannerBufferResponse =
          await helpers.storeImageWithValidation(bannerBuffer);

        if (
          banner &&
          (mobile_bannerBufferResponse.width !== 330 ||
            mobile_bannerBufferResponse.height !== 174)
        ) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid banner dimensions for MobilePage. Banner size should be exactly 330x174 pixels.",
            data: "",
          });
        }

        let imageName = `${Date.now()}_${banner.name}`;
        imageNameOne = `${dirOne}/` + imageName;
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

        req.body.banner = `promotion/${imageName}`;
      }
    }

    //

    req.body.item = store;
    req.body.store = store;

    if (req.body.duration) {
      let deadline = await promotionService.setDuration(5);

      req.body.startDate = deadline.currentDate;
      req.body.endDate = deadline.deadlineDate;
    } else {
      let deadline = await promotionService.setDuration(1);

      req.body.startDate = deadline.currentDate;
      req.body.endDate = deadline.deadlineDate;
    }

    let data = new promotion(req.body);
    data = await data.save();

    let addBanner = new Banner({
      type: "promotionBanner",
      mobile_banner: req.body.banner,
      store: store,
      promotion: data._id,
    });
    addBanner.save();

    // update user information

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

const adminPromotions = async (req, res) => {
  let query = {};
  try {
    // adjust query based on promotion id

    query.type = "store";

    // get store information

    let data = await helpers.paginate(promotion, query);
    let result = data.data;

    result = await Promise.all(
      result.map(async (e) => {
        console.log(e);
        e.itemData = await stores.findById(e.item).select({ store_name: 1 });
        return e;
      })
    );

    let pagination = data.pagination;

    // update user information

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
      data: {},
    });
  }
};

const adminUpdatePromotion = async (req, res) => {
  let { store } = req.body;
  let { id } = req.params;
  try {
    if (req.files) {
      let banner = req.files.banner;
      const dirOne = "public/promotion";
      let imageNameOne;
      if (banner) {
        let imageName = `${Date.now()}_${banner.name}`;
        imageNameOne = `${dirOne}/` + imageName;
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

        req.body.banner = `promotion/${imageName}`;
      }
    }

    //

    req.body.type = "store";
    req.body.item = store;
    req.body.store = store;

    if (req.body.duration) {
      let deadline = await promotionService.setDuration(5);

      req.body.startDate = deadline.currentDate;
      req.body.endDate = deadline.deadlineDate;
    }

    let data = await promotion.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    // update user information

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

// Ending Vender Order Section

const destroy = async (req, res) => {
  let { id } = req.params;
  try {
    let data = await promotion.findByIdAndDelete({
      _id: id,
    });

    let deleteBanner = await Banner.findOneAndDelete({
      promotion: id,
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

const search = async (req, res) => {
  try {
    const regex = new RegExp(req.params.search, "i"); // 'i' flag for case-insensitive search
    const results = await stores
      .find({
        $or: [
          { store_name: regex },
          { aboutus: regex },
          { types: regex },
          { store_url: regex },
          { zone: regex },
          { area: regex },
          { "opening_hours.day": regex }, // Assuming 'opening_hours' is an array of objects with a 'day' field
          // Add more fields here if needed
        ],
      })
      .select({ name: 1 });
    return res.json({
      status: 200,
      message: "success",
      data: results,
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
  store,
  all,
  update,

  // Admin Promotions

  adminPromotions,
  adminStoreBanner,
  adminUpdatePromotion,
  search,

  // End Admin Promotions

  destroy,
};
