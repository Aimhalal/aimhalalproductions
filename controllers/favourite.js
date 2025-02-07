//  vendor routes
import faq from "../models/faq.js";
import favourite from "../models/favourite.js";
import favouriteServie from "../services/favourite.js";
import helpers from "../utils/helpers.js";

const addToFavourite = async (req, res) => {
  try {
    // check if item has already favourited

    let data = await favourite.findOne({
      item: req.body.item,
      user: req.user._id,
      type: req.body.type,
    });

    if (data) {
      // remove reviews

      data = await favourite.findOneAndDelete({
        _id: data._id,
      });

      // let Fav = await favouriteServie.getFavouriteById(data._id);

      return res.json({
        status: 200,
        message: "success",
        data: { isFav: false },
      });
    } else {
      req.body.user = req.user._id;

      let Fav = new favourite(req.body);
      Fav = await Fav.save();

      // get favourite complete object

      // Fav = await favouriteServie.getFavouriteById(Fav._id);

      return res.json({
        status: 200,
        message: "success",
        data: { isFav: true },
      });
    }

    // substitute variables
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const getFavourites = async (req, res) => {
  let { type } = req.params;
  let query = {};
  try {
    query.user = req.user._id;
    query.type = type;

    let data = await helpers.paginate(favourite);
    let pagination = data.pagination;
    let records = data.data;

    // get complete information for specific product

    records = await Promise.all(
      records.map((e) => {
        return favouriteServie.getFavouriteById(e._id);
      })
    );

    return res.json({
      status: 200,
      message: "success",
      data: records,
      pagination,
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

const allFavourties = async (req, res) => {
  let { type } = req.params;
  let query = {};
  let stores = [];
  let dishes = [];
  try {
    query.user = req.user._id;

    let data = await helpers.paginate(favourite);
    let pagination = data.pagination;
    let records = data.data;

    // get complete information for specific product

    records = await Promise.all(
      records.map(async (e) => {
        if (e.type == "store") {
          stores.push(await favouriteServie.getFavouriteById(e._id, e.type));
        } else {
          dishes.push(await favouriteServie.getFavouriteById(e._id, e.type));
        }
      })
    );

    return res.json({
      status: 200,
      message: "success",
      data: { stores, dishes },
      pagination,
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

export default {
  addToFavourite,
  getFavourites,
  allFavourties,
};
