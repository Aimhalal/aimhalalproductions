import promotion from "../models/promotion.js";
import store from "../models/stores.js";
import itemService from "../services/product.js";

const getPromotionItems = async (item) => {
  try {
    const currentTime = new Date();
    let data = await promotion.findOne({
      // startDate: { $gte: currentTime }, // Check if the promotion start date is before or equal to the current time
      // endDate: { $gte: currentTime },   // Check if the promotion end date is after or equal to the current time
      item: item,
    });

    return data;
  } catch (error) {
    return 0;
  }
};

const nearByPromotions = async (query = {}) => {
  try {
    let data = await promotion
      .find(query)
      .populate({
        path: "store",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .lean();

    data = await Promise.all(
      data.map(async (e) => {
        e.itemModal = null;
        if (e.type == "item") {
          e.itemModal = await itemService.getProductById(e.item);
          if (e.itemModal) {
            let promo = await getPromotionItems(e.item);
            if (promo) {
              e.itemModal.price = promo.price;
              e.itemModal.pictures = [promo.banner];
              e.itemModal.discount = 0;
              e.itemModal.discounted_price = 0;
              e.itemModal.discount_percentage = 0;
              e.itemModal.incredients = [];
            }
          }
        }
        return e;
      })
    );

    return data;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

const setDuration = async (number, startDate = "") => {
  try {
    let currentDate;
    if (startDate) {
      currentDate = new Date(startDate);
    } else {
      currentDate = new Date();
    }
    // Current date
    const deadlineDate = new Date(
      currentDate.getTime() + number * 24 * 60 * 60 * 1000
    ); // Calculate deadline
    return { currentDate, deadlineDate };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export default {
  nearByPromotions,
  setDuration,
  getPromotionItems,
};
