import storeService from "../services/store.js";
import promotionService from "../services/promotion.js";

import roleService from "../services/role.js";
import banner from "../models/banner.js";
import { updateMain } from "./prayerTime.js";

const home = async (req, res) => {
  // console.log(req.user.verificationToken, " verification token")
  const userId = req.user._id;
  const { longitude, latitude } = req.body;
  console.log(req, " user");

  let query = {
    longitude: req.body.longitude,
    latitude: req.body.latitude,
  };
  try {
    let promotions = [];
    let homeBanners = await banner.find({ isArchive: false });

    let data = await storeService.nearByStores({
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [req.body.longitude, req.body.latitude],
          },
          $minDistance: 0,
          $maxDistance: 5000,
        },
      },
    });

    if (Array.isArray(data)) {
      data = await Promise.all(
        data.map(async (e) => {
          return await storeService.getStoreById(e._id);
        })
      );
    } else {
      data = [];
    }

    // get store types

    let storeTypes = await roleService.getVendorTypes();
    updateMain(userId, latitude, longitude, req.user.fcmToken);

    return res.json({
      status: 200,
      message: "success",
      data: {
        promotion: promotions,
        categories: storeTypes,
        stores: data,
        homeBanners,
      },
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

export default {
  home,
};
