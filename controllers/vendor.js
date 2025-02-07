import category from "../models/category.js";
import items from "../models/items.js";
import Order from "../models/order.js";
import helpers from "../utils/helpers.js";

// call services

import itemService from "../services/product.js";
import orderService from "../services/order.js";

import moment from "moment";

// dsds
const today = moment().startOf("day");
const sunday = today.clone().startOf("week");
const saturday = today.clone().endOf("week");

const home = async (req, res) => {
  let { _id } = req.user.store;

  const orderStatusData = {
    new: 0,
    overdueOrder: 0,
    completetedOrder: 0,
    averageTimeDelivery: 0,
  };

  const allOrders = {
    all: [],
    accepted: [],
    preparing: [],
    delivery: [],
    completed: [],
  };

  try {
    // get data based on order status

    let newOrder = await Order.find({
      store: _id,
      orderStatus: "active",
    });
    orderStatusData.new = newOrder.length;

    let overdue = await Order.find({
      store: _id,
      orderStatus: "overdue",
    });
    orderStatusData.overdueOrder = overdue.length;

    let completedOrders = await Order.find({
      store: _id,
      orderStatus: "completed",
    });
    orderStatusData.completetedOrder = completedOrders.length;

    // ending data based on OrderStatus

    // All Order Combination

    let orders = await helpers.paginate(Order, { store: _id });
    let result = orders.data;

    result = await Promise.all(
      result.map(async (e) => {
        e = await orderService.getOrderById(e._id);
        allOrders.all.push(e);
        if (e.orderStatus == "new") {
          allOrders.accepted.push(e);
        } else if (e.orderStatus == "preparing") {
          allOrders.preparing.push(await orderService.getOrderById(e._id));
        } else if (e.orderStatus == "delivery") {
          allOrders.preparing.push(await orderService.getOrderById(e._id));
        } else if (e.orderStatus == "completed") {
          allOrders.preparing.push(await orderService.getOrderById(e._id));
        }
      })
    );

    const popularItemsData = await Order.aggregate([
      {
        $match: {
          store: _id,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: { item: "$items.item", order: "$_id" },
          totalQuantity: { $sum: "$items.qty" },
        },
      },
      {
        $group: {
          _id: "$_id.item",
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    // Map popular items to their details from the Product model
    const popularItemsDetails = await items.find({
      _id: { $in: popularItemsData.map((item) => item._id) },
    });

    const categoriesData = await category.find({
      "default_stores.store": _id,
    });

    return res.json({
      status: 200,
      message: "success",
      data: {
        orderStatus: orderStatusData,
        orders: allOrders,
        popularItems: popularItemsDetails,
        categories: categoriesData,
      },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const analytics = async (req, res) => {
  let activeStores = [];
  let ordersToday = [];
  let customersToday = [];
  let totalRevenue = [];
  let bestStores = [];
  let analytics = [];
  let { id } = req.user.store;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the beginning of the day

  let { _id } = req.user.store;

  try {
    // Orders today

    ordersToday = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    // Unique customer count today
    customersToday = await Order.distinct("customer", {
      createdAt: { $gte: today },
    });

    // total Revenue today
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    // revenue per month

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalRevenueMonthly = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    //  weekly Orders count

    //  Weekly Orders Count

    const orders = await Order.find({
      store: _id,
      createdAt: {
        $gte: sunday.toDate(),
        $lte: saturday.toDate(),
      },
    });

    const weeklyOrders = Array.from({ length: 7 }, (_, index) => {
      const startOfDay = sunday.clone().add(index, "days").startOf("day");
      const endOfDay = sunday.clone().add(index, "days").endOf("day");

      const dayLabel = startOfDay.format("dddd");

      const dayOrders = orders.filter(
        (order) =>
          moment.utc(order.createdAt).isSameOrAfter(startOfDay) &&
          moment.utc(order.createdAt).isSameOrBefore(endOfDay)
      );

      return {
        label: dayLabel,
        orders: dayOrders.length,
      };
    });

    // Ending Weekly Filter

    // Weekly Customers

    let WeeklyCustomers = await Order.distinct("customer", {
      store: _id,
      createdAt: {
        $gte: sunday.toDate(),
        $lte: saturday.toDate(),
      },
    });

    WeeklyCustomers = Array.from({ length: 7 }, (_, index) => {
      const startOfDay = sunday.clone().add(index, "days").startOf("day");
      const endOfDay = sunday.clone().add(index, "days").endOf("day");

      const dayLabel = startOfDay.format("dddd");

      const dayOrders = WeeklyCustomers.filter(
        (order) =>
          moment.utc(order.createdAt).isSameOrAfter(startOfDay) &&
          moment.utc(order.createdAt).isSameOrBefore(endOfDay)
      );

      return {
        label: dayLabel,
        orders: dayOrders.length,
      };
    });

    // Ending Weekly Customers

    // Best products

    const bestSellingItemsToday = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sunday.toDate(),
            $lte: saturday.toDate(),
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.item", // Group by item ID
          totalQuantity: { $sum: "$items.qty" }, // Calculate total quantity sold
        },
      },
      {
        $sort: {
          totalQuantity: -1, // Sort in descending order based on total quantity sold
        },
      },
      {
        $limit: 5, // Limit the result to the top 5 best-selling items
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
    ]);

    return res.json({
      status: 200,
      message: "success",
      data: {
        ordersToday: ordersToday.length,
        customersToday: customersToday.length,
        totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
        totalRevenueMonthly: totalRevenueMonthly[0]
          ? totalRevenueMonthly[0].total
          : 0,
        weeklyOrders,
        WeeklyCustomers,
        bestSellingItemsToday,
      },
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
  home,
  analytics,
};
