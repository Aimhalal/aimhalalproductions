import page from "../models/page.js";

const store = async (req, res) => {
  try {
    let data = new page(req.body);
    data = await data.save();
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

const update = async (req, res) => {
  let { id } = req.params;
  try {
    let data = await page.findByIdAndUpdate(
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

const index = async (req, res) => {
  try {
    let data = await page.find({});
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

const view = async (req, res) => {
  let { id } = req.params;
  try {
    console.log(id);

    let data = await page.findById({
      _id: id,
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

export default {
  store,
  view,
  update,
  index,
};
