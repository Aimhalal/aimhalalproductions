import Joi from "joi";
import cron from "node-cron";
import Order from "../models/order.js";
import orderService from "../services/order.js";
import order from "../models/order.js";
import helpers from "../utils/helpers.js";
import mongoose from "mongoose";
import orderSocket from "../socket/order.js";
import stores from "../models/stores.js";
import users from "../models/users.js";
import rider from "../models/rider.js";
import authentication from "../middlewares/authentication.js";

// Function to notify users about cancellation
const notifyCancellation = async (order) => {
  const storeData = await stores.findOne({ _id: order.store });
  const storeUser = await users.findOne({ _id: storeData.user });
  const customerData = await users.findOne({ _id: order.customer });

  const customerText = `
        Dear ${customerData.username}, 

        Your Order has been cancelled,

        Order No: ${order.orderId}

        https://example.com/
    `;

  const storeText = `
        Dear ${storeUser.username}, 

        This Order has been cancelled,

        Order No: ${order.orderId}

        https://example.com/login
    `;

  await helpers.sendOrderEmail(customerData.email, customerText);
  await helpers.sendTwilioSMS(
    `Your Order has been cancelled, Order No: ${order.orderId}`,
    customerData.number
  );
  await helpers.sendOrderEmail(storeUser.email, storeText);
  await helpers.sendTwilioSMS(
    `Order cancelled ${order.orderId}`,
    storeUser.number
  );
};

// Cron job to check and cancel orders not updated within 8 minutes
cron.schedule("* * * * *", async () => {
  const eightMinutesAgo = new Date(Date.now() - 0.5 * 60 * 1000);
  const ordersToCancel = await Order.find({
    orderStatus: { $in: ["accepted"] },
    assignRider: null,
    updatedAt: { $lte: eightMinutesAgo },
  });
  try {
    await Promise.all(
      ordersToCancel.map(async (order) => {
        order.orderStatus = "cancelled";
        await order.save();

        await notifyCancellation(order);

        let newOrder = [];
        let accepted = [];
        let preparing = [];
        let dispatched = [];
        let completed = [];
        let delivered = [];
        let cancelled = [];

        // adding socket data here

        let orders = await Order.find({
          store: mongoose.Types.ObjectId(order.store),
        }).lean();
        await Promise.all(
          orders.map(async (e) => {
            let orderstatus = await orderService.getOrderById(e._id);

            if (orderstatus.orderStatus == "active") {
              newOrder.push(orderstatus);
            }
            if (orderstatus.orderStatus == "accepted") {
              accepted.push(orderstatus);
            }
            if (orderstatus.orderStatus == "preparing") {
              preparing.push(orderstatus);
            }
            if (orderstatus.orderStatus == "pickup") {
              dispatched.push(orderstatus);
            }
            if (orderstatus.orderStatus == "completed") {
              completed.push(orderstatus);
            }
            if (orderstatus.orderStatus == "delivered") {
              delivered.push(orderstatus);
            }
            if (orderstatus.orderStatus == "cancelled") {
              cancelled.push(orderstatus);
            }
          })
        );

        let newdata = {
          newOrder: newOrder,
          accepted: accepted,
          preparing: preparing,
          dispatched: dispatched,
          completed: completed,
          delivered: delivered,
          cancelled: cancelled,
        };
        // return order modal as data
        const socket = await orderSocket.getIoInstance();

        socket.emit("orders", newdata);

        let data = await orderService.nearByOrders({
          assignRider: null,
          orderStatus: "accepted",
        });

        socket.emit("nearbyOrder", data);
      })
    );
  } catch (error) {
    console.log(error);
  }
});

// customer Order Section

const store = async (req, res) => {
  try {
    // validate user request
    const orderSchema = Joi.object({
      store: Joi.string().required(),
      items: Joi.array().required(),
      price: Joi.number(),
      qty: Joi.number(),
      tip: Joi.any(),
      totalPrice: Joi.number(),
      totalQuantity: Joi.number().required(),
      instruction: Joi.string().allow(""),
      shippingFees: Joi.number().allow(0),
      shippingDistance: Joi.string().allow(""),
      cardId: Joi.string().required(),
      orderType: Joi.any(),
      address: Joi.any(),
      latitude: Joi.any(),
      longitude: Joi.any(),
      cod: Joi.any(),
    });

    const { error } = orderSchema.validate(req.body);
    if (error)
      return res
        .status(200)
        .json({ status: 400, message: error.message, data: {} });

    // update user information

    req.body.customer = req.user._id;

    let storeData = await stores.findOne({
      _id: mongoose.Types.ObjectId(req.body.store),
    });
    let storeUser = await users.findOne({ _id: storeData.user });
    let longitudeData = req.body.longitude;
    let latitudeData = req.body.latitude;

    let location = {
      type: "Point",
      coordinates: [
        longitudeData ? longitudeData : 0,
        longitudeData ? latitudeData : 0,
      ],
    };
    req.body.location = location;

    // generate ordernumber

    req.body.orderNo = Math.floor(Math.random() * 10000000);

    req.body.paymentType = req.body.cod ? "card" : "cash";

    let data = new Order(req.body);
    data = await data.save();

    // store user notifications

    let restaurantNotification = {
      title: `New Order Placed, Order No: ${data.orderNo}`,
      notification_for: mongoose.Types.ObjectId(data._id),
      user: mongoose.Types.ObjectId(storeUser._id),
      store: mongoose.Types.ObjectId(req.body.store),
      order: data._id,
    };

    await helpers.createNotification(restaurantNotification, storeUser);

    let customerNotification = {
      title: `Your Order has been Placed, Order No: ${data.orderNo}`,
      notification_for: mongoose.Types.ObjectId(data._id),
      user: mongoose.Types.ObjectId(req.user._id),
      store: mongoose.Types.ObjectId(req.body.store),
      order: data._id,
    };

    await helpers.createNotification(customerNotification, req.user);

    let customerText = `
            
        Dear ${req.user.username}, 
        
        Your Order has successfully placed,

        Order No: ${data.orderNo}

        get back to you with driver details

        `;
    let storeText = `
            
        Dear ${storeUser.username}, 
        
        New Order Placed,

        Order No: ${data.orderNo}

        https://aimhalal.com/login

        `;

    await helpers.sendOrderEmail(req.user.email, customerText);
    await helpers.sendTwilioSMS(
      `Your Order has been Placed ${data.orderNo}`,
      req.user.number
    );
    await helpers.sendOrderEmail(storeUser.email, storeText);
    await helpers.sendTwilioSMS(
      `New Order Placed ${data.orderNo}`,
      storeUser.number
    );

    let newOrder = [];
    let accepted = [];
    let preparing = [];
    let dispatched = [];
    let completed = [];
    let delivered = [];

    // adding socket data here

    let orders = await order
      .find({ store: mongoose.Types.ObjectId(data.store) })
      .lean();
    await Promise.all(
      orders.map(async (e) => {
        let orderstatus = await orderService.getOrderById(e._id);

        if (orderstatus.orderStatus == "active") {
          newOrder.push(orderstatus);
        }
        if (orderstatus.orderStatus == "accepted") {
          accepted.push(orderstatus);
        }
        if (orderstatus.orderStatus == "preparing") {
          preparing.push(orderstatus);
        }
        if (orderstatus.orderStatus == "pickup") {
          dispatched.push(orderstatus);
        }
        if (orderstatus.orderStatus == "completed") {
          completed.push(orderstatus);
        }
        if (orderstatus.orderStatus == "delivered") {
          delivered.push(orderstatus);
        }
      })
    );

    let newdata = {
      newOrder: newOrder,
      accepted: accepted,
      preparing: preparing,
      dispatched: dispatched,
      completed: completed,
      delivered: delivered,
    };
    // return order modal as data
    const socket = await orderSocket.getIoInstance();

    let newOrderStore = req.body.store;
    socket.emit("newOrder", newOrderStore);

    socket.emit("orders", newdata);

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
    let data = await orderService.getOrderById(id);
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
const recentOrder = async (req, res) => {
  let { _id } = req.user;

  let data = {};
  try {
    let latestOrder = await Order.find({
      customer: _id,
      orderStatus: { $in: ["preparing", "pickup", "accepted", "active"] },
    })
      .sort({ _id: -1 }) // Sort in descending order based on _id field
      .lean();

    latestOrder = await Promise.all(
      latestOrder.map(async (e) => {
        return await orderService.getOrderById(e._id);
      })
    );

    // if (latestOrder) {
    //     data = await orderService.getOrderById(latestOrder._id)
    // }

    return res.json({
      status: 200,
      message: "success",
      data: latestOrder,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const userOrders = async (req, res) => {
  try {
    let data = await helpers.paginate(order, {
      customer: req.user._id,
      orderStatus: "completed",
    });

    let finalData = await data.data;

    finalData = await Promise.all(
      finalData.map(async (order) => {
        return orderService.getOrderById(order._id);
      })
    );

    //

    return res.json({
      status: 200,
      message: "success",
      data: finalData,
      result: data.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// Ending Customer Order Section

// Vendor Order Section

const vendorOrders = async (req, res) => {
  try {
    let newOrder = [],
      prepare = [],
      delivered = [];

    // setup intial variables

    let query = {
      store: req.user.store,
    };
    let data = await helpers.paginate(order, query);

    // get order information based on vendor

    let finalData = data.data;
    finalData = await Promise.all(
      finalData.map(async (or) => {
        or = await orderService.getOrderById(or._id);
        switch (or.orderStatus) {
          case "active":
            newOrder.push(or);
            break;
          case "preparing":
            prepare.push(or);
            break;
          default:
            delivered.push(or);
        }

        return or;
      })
    );

    return res.json({
      status: 200,
      message: "success",
      data: { newOrder, prepare, delivered },
      paginate: data.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const updateOrderStatus = async (req, res) => {
  let { id } = req.params;
  try {
    const orderSchema = Joi.object({
      orderStatus: Joi.string(),
      feedback: Joi.string().allow(""),
      estimatedTime: Joi.string().allow(""),
    });

    const { error } = orderSchema.validate(req.body);
    if (error)
      return res
        .status(200)
        .json({ status: 400, message: error.message, data: {} });

    let data = await Order.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: req.body,
      }
    );

    data = await orderService.getOrderById(id);

    // update order socket inform

    const socket = orderSocket.getIoInstance();

    // let data = await allOrders.allOrders(bar,assignedBartender);
    socket.emit("singleOrder", data);

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

// Ending Vender Order Section

export default {
  store,
  view,
  userOrders,
  recentOrder,

  // vendor Orders

  vendorOrders,
  updateOrderStatus,
};
