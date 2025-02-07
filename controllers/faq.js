//  vendor routes
import faq from "../models/faq.js";

const store = async (req, res) => {
  try {
    let Faq = await faq.insertMany(req.body.data);

    return res.json({
      status: 200,
      message: "success",
      data: Faq,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const index = async (req, res) => {
  try {
    let data = await faq.find({});
    return res.json({
      status: 200,
      message: "success",
      data: data,
      pagination: null,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
      pagination: {},
    });
  }
};

const update = async (req, res) => {
  let { data } = req.body;
  try {
    const updatePromises = data.map(async (item) => {
      await faq.updateOne(
        { _id: item._id },
        { $set: { question: item.question, answer: item.answer } }
      );
    });

    await Promise.all(updatePromises);
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
      pagination: {},
    });
  }
};

export default {
  store,
  index,
  update,
};
