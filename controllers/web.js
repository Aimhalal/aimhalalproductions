import inquiry from "../models/inquiry.js";
import newsletter from "../models/newsletter.js";
import promotion from "../services/promotion.js";
import helpers from "../utils/helpers.js";

const store = async (req, res) => {
  try {
    let data = new inquiry(req.body);
    await data.save();

    //

    let inquery = await helpers.inquiry(data);

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

const newsLetter = async (req, res) => {
  let { email } = req.body;
  try {
    let checkData = await newsletter.findOne({
      email,
    });
    if (checkData) {
      return res.json({
        status: 409,
        message: "Email Already Submitted",
        data: checkData,
      });
    }

    let data = new newsletter({ email });
    data = await data.save();

    // Add a newsl

    await helpers.sendNewsletter(email);

    return res.json({
      status: 200,
      message: "Thanks for your subscription",
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

const promotions = async (req, res) => {
  try {
    let data = await promotion.nearByPromotions();
    return res.json({
      status: 200,
      message: "success",
      data,
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
  newsLetter,
  promotions,
};
