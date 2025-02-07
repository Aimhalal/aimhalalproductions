import banner from "../models/banner.js";
import fs from "fs";
import sizeOf from "image-size";
import helpers from "../utils/helpers.js";
import promotionService from "../services/promotion.js";
import storeService from "../services/store.js";

const create = async (req, res) => {
  let { type } = req.body;

  try {
    if (req.files) {
      let picture = req.files.banner;

      // await helpers.trimFile(picture)

      let mobile_banner = req.files.mobile_banner;
      const dirOne = "public/banner";
      let imageNameOne;

      if (picture) {
        picture.name = picture.name.replace(/[()X@ _]+/g, "_"); // Replace all whitespace characters with underscores

        const pictureBuffer = req.files.banner.data;
        let pictureBufferResponse = await helpers.storeImageWithValidation(
          pictureBuffer
        );
        if (
          picture &&
          (pictureBufferResponse.width !== 1327 ||
            pictureBufferResponse.height !== 280)
        ) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid banner dimensions for homepage. Banner size should be exactly 1327x280 pixels.",
            data: "",
          });
        }

        let imageName = `${Date.now()}_${picture.name}`;
        imageNameOne = `${dirOne}/` + imageName;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        picture.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 500,
              message: error.message,
              data: "",
            });
          }
        });
        req.body.banner = `banner/${imageName}`;
      }

      if (mobile_banner) {
        mobile_banner.name = mobile_banner.name.replace(/[()X@ _]+/g, "_"); // Replace all whitespace characters with underscores

        const mobile_bannerBuffer = req.files.mobile_banner.data;
        let mobile_bannerBufferResponse =
          await helpers.storeImageWithValidation(mobile_bannerBuffer);

        if (
          mobile_banner &&
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

        let imageName = `${Date.now()}_${mobile_banner.name}`;
        imageNameOne = `${dirOne}/` + imageName;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        mobile_banner.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(500).json({
              status: 500,
              message: error.message,
              data: "",
            });
          }
        });
        req.body.mobile_banner = `banner/${imageName}`;
      }
    }

    if (req.body.duration) {
      let deadline = await promotionService.setDuration(
        req.body.duration,
        req.body.startDate
      );

      req.body.endDate = deadline.deadlineDate;
    }

    let data = new banner(req.body);
    data = await data.save();

    return res.json({
      status: 200,
      message: "success",
      data,
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

const update = async (req, res) => {
  let query = {
    longitude: req.body.longitude,
    latitude: req.body.latitude,
  };
  try {
    let promotions = await promotionService.nearByPromotions(
      req.body.longitude,
      req.body.latitude
    );

    let data = await storeService.nearByStores({
      isAvailable: true,
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

    data = await Promise.all(
      data.map(async (e) => {
        return await storeService.getStoreById(e._id);
      })
    );

    // get store types

    let storeTypes = await roleService.getVendorTypes();

    return res.json({
      status: 200,
      message: "success",
      data: { promotion: promotions, categories: storeTypes, stores: data },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: {},
      pagination: {},
    });
  }
};
const destroy = async (req, res) => {
  try {
    let data = await banner.findByIdAndDelete({
      _id: req.params.id,
    });

    return res.json({
      status: 200,
      message: "successfully deleted",
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

const setArchive = async (req, res) => {
  try {
    let checkPromotion = await banner.findById({
      _id: req.params.id,
    });

    if (!req.body.isArchive) {
      let deadline = await promotionService.setDuration(
        checkPromotion.duration
      );
      req.body.startDate = deadline.currentDate;
      req.body.endDate = deadline.deadlineDate;
    }

    let data = await banner.findByIdAndUpdate(
      {
        _id: req.params.id,
      },
      {
        $set: req.body,
      }
    );

    return res.json({
      status: 200,
      message: "Banner Updated!",
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

const view = async (req, res) => {
  try {
    let data = await banner.find({ isArchive: false });
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
    let data = await banner.find();
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

export default {
  create,
  update,
  destroy,
  view,
  setArchive,
  all,
};
