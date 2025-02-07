import card from "../models/card.js";
import users from "../models/users.js";

const store = async (req, res) => {
  try {
    req.body.user = req.user._id;

    let cards = new card(req.body);
    cards = await cards.save();

    // update information to user modal too

    await users.findByIdAndUpdate(
      {
        _id: req.user._id,
      },
      {
        $push: {
          "card.card": cards._id,
        },
      }
    );

    return res.json({
      status: 200,
      message: "success",
      data: cards,
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
};
