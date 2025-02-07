import store from "../models/stores.js";
import favService from "../services/favourite.js";
import stores from "../models/stores.js";
import items from "../models/items.js";
import category from "../models/category.js";
import order from "../models/order.js";
import mongoose from "mongoose";

const checkSlugExist = async (slug) => {
  try {
    let data = await store.findOne({
      slug: slug,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

function getOpeningHoursForDay(currentDay, openingHours, isPhysical = true) {
  const dayInfo = openingHours.find((day) => day.day === currentDay);

  if (!isPhysical) {
    return {
      closed: false,
      string: `12:00 to 12:00`,
      startTime: "12:00",
      endTime: "12:00",
    };
  }
  if (!dayInfo) {
    return {
      closed: true,
      string: "Closed",
      startTime: "00:00",
      endTime: "00:00",
    }; // Or any other message indicating that the store is closed on this day
  }
  if (!dayInfo.on) {
    return {
      closed: true,
      string: "Closed",
      startTime: "00:00",
      endTime: "00:00",
    }; // Or any other message indicating that the store is closed on this day
  }

  let startDisplay = newFormatedTime(dayInfo.startTime);
  let endDisplay = newFormatedTime(dayInfo.endTime);

  const startTime = formatTime(dayInfo.startTime);
  const endTime = formatTime(dayInfo.endTime);

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

  // Convert start and end times to minutes for comparison
  const startTimeMinutes = convertTimeToMinutes(startTime);
  const endTimeMinutes = convertTimeToMinutes(endTime);

  // console.log("Actual Time", now.getHours() + ":" + now.getMinutes())
  // console.log("Actual End Time Time", endTime)
  // console.log("convertedTime", startTime)
  // console.log("converted End Time", endTime)
  // console.log("Start Time", startTimeMinutes)
  // console.log("End Time Minutes", endTimeMinutes)

  // Check if current time is between start and end times
  const isClosed =
    currentTime < startTimeMinutes || currentTime > endTimeMinutes;
  if (startDisplay == "0:00 am") {
    startDisplay = "12:00 am";
  }
  if (endDisplay == "0:00 pm") {
    endDisplay = "12:00 pm";
  }

  console.log(`${startDisplay} to ${endDisplay}`);

  return {
    closed: isClosed,
    string: `${startDisplay} to ${endDisplay}`,
    startTime: dayInfo.startTime,
    endTime: dayInfo.endTime,
  };
}

function formatTime(time) {
  const [hour, minute] = time.split(":").map((part) => parseInt(part)); // Split time and parse parts as integers
  const formattedHour = hour < 10 ? "0" + hour : hour; // Ensure hour is two digits
  const formattedMinute = minute < 10 ? "0" + minute : minute; // Ensure minute is two digits
  return `${formattedHour}:${formattedMinute}`; // Return formatted time
}
function convertTimeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

//   function formatTime(time) {
//     // Assuming time is already in HH:mm format
//     return time;
// }

// function convertTimeToMinutes(time) {
//     const [hours, minutes] = time.split(':').map(Number);
//     return hours * 60 + minutes;
// }

function newFormatedTime(time) {
  const [hours, minutes] = time.split(":");
  const formattedHours = parseInt(hours, 10) % 12;
  const period = parseInt(hours, 10) >= 12 ? "pm" : "am";

  return `${formattedHours}:${minutes} ${period}`;
}

// Vend Store Services
const getStoreById = async (stor, user = "") => {
  try {
    let data = await store
      .findById({
        _id: stor,
      })
      .populate({
        path: "user",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
          document: 1,
          menu: 1,
        },
      })
      .lean();

    data.isFavourite = false;
    data.rating = 2;

    // check if in Favourites

    if (user) {
      data.isFavourite = (await favService.isFavourite(user, stor._id))
        ? true
        : false;
    }
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const currentDate = new Date();
    const currentDay = daysOfWeek[currentDate.getDay()];

    const openingHoursForToday = getOpeningHoursForDay(
      currentDay,
      data.opening_hours,
      data.isPhysical
    );
    console.log(openingHoursForToday);
    if (openingHoursForToday.closed == true) {
      data.isAvailable = false;
    } else {
      data.isAvailable = true;
    }
    // get store current day working
    data.workingHour = openingHoursForToday.string;
    data.startTime = openingHoursForToday.startTime;
    data.endTime = openingHoursForToday.endTime;
    data.isVirtual = data.isPhysical ? false : true;

    return data;
  } catch (error) {
    return error.message;
  }
};

const checkStoreAlreadyExist = async (body) => {
  try {
    let data = await store.findOne({
      store_name: body.store_name,
      user: body.user,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

const getCompleteStoreInfo = async (id) => {
  try {
    let data = await store.findById({
      _id: id,
    });
    return res.json({
      status: 200,
      message: "success",
      data: {
        store: {},
        reviews: {},
        totalOrder: {},
        initialProducst: [],
        categorWiseData: [
          {
            name: "noodles",
            products: [{}],
          },
        ],
      },
    });
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

const getOverallStore = async (id) => {
  try {
    const storeData = await stores.findById({ _id: id });

    // Fetch reviews for the store
    const reviews = await items
      .find({ store: id })
      .populate("review.customer")
      .exec();

    // Calculate total orders (assuming you have an "order" model)
    const totalOrders = await order.countDocuments({ store: id }).exec();

    // Fetch initial products
    const initialProducts = await items.find({ store: id }).limit(10).exec();

    // Fetch category-wise data
    const categories = await category
      .find({
        "default_stores.store": mongoose.Types.ObjectId(id),
      })
      .exec();
    const categoryWiseData = await Promise.all(
      categories.map(async (category) => {
        const productsInCategory = await items
          .find({ category: category._id, store: id })
          .exec();
        return {
          name: category.name,
          products: productsInCategory,
        };
      })
    );

    return {
      store: storeData,
      reviews,
      totalOrders,
      initialProducts,
      categorWiseData: categoryWiseData,
    };
  } catch (error) {
    return error.message;
  }
};

//  Ending Vendor Store Services
//  Ending Vendor Store Services

const nearByStores = async (query) => {
  try {
    let data = await store
      .find(query)
      .populate({
        path: "user",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .lean();

    return data;
  } catch (error) {
    return error.message;
  }
};

// App Services

const storeByid = async (req, res) => {
  try {
  } catch (error) {}
};

// App Services Ends here

// Admin Store Services

// Ending Admin Store services

export default {
  getStoreById,
  checkStoreAlreadyExist,
  getCompleteStoreInfo,
  nearByStores,

  getOverallStore,
  checkSlugExist,
};
