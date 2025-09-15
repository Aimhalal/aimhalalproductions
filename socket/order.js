import { Server } from 'socket.io';
import authentication from '../middlewares/authentication.js';
import jwt from 'jsonwebtoken';

import orderService from '../services/order.js';
import order from '../models/order.js';
import helpers from '../utils/helpers.js';
import mongoose from 'mongoose';
import users from '../models/users.js';
import stores from '../models/stores.js';
import review from '../models/review.js';
import { response } from 'express';
import rider from '../models/rider.js';
import moment from 'moment/moment.js';
import riderService from '../services/rider.js';
import riderVehicle from '../models/riderVehicle.js';

let io;

function getIoInstance() {
    if (!io) {
        throw new Error('Socket.io has not been initialized yet.');
    }
    return io;
}

function initOrder() {
    io = new Server(5404, {
        cors: {
            origin: '*'
        }
    });

    // io.use(async (socket, next) => {
    //     try {
    //         const token = socket.handshake.headers.token;
    //         const riderToken = socket.handshake.headers.riderToken;

    //         if (token) {
    //             let verification = await authentication.verifySocket(token);

    //             if (verification) {
    //                 verification = await users.findByIdAndUpdate(verification._id, {
    //                     $set: { socket: socket.id }
    //                 }, { new: true });

    //                 socket.user = verification;
    //                 return next();
    //             } else {
    //                 return next(new Error('User authentication error'));
    //             }
    //         }

    //         if (riderToken) {
    //             let riderVerification = await authentication.verifyRiderSocket(riderToken);

    //             if (riderVerification) {
    //                 riderVerification = await users.findByIdAndUpdate(riderVerification._id, {
    //                     $set: { socket: socket.id }
    //                 }, { new: true });

    //                 socket.rider = riderVerification;
    //                 return next();
    //             } else {
    //                 return next(new Error('Rider authentication error'));
    //             }
    //         }

    //         // If neither token nor riderToken is provided, return an authentication error
    //         return next(new Error('No authentication token provided'));

    //     } catch (error) {
    //         console.error('Authentication error:', error);
    //         return next(new Error('Internal server error'));
    //     }
    // });


    io.on('connection', (socket) => {
        console.log('📦 Order socket connected:', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });

        // Access user information from the Express request object
        const user = socket.user;
        let storeId = socket.handshake.query.storeId;
        let orderid = socket.handshake.query.orderid;
        let orderStatus = socket.handshake.query.orderStatus;
        let estimatedTime = socket.handshake.query.estimatedTime;
        // if (user.store) {

        // }

        // if(user.store)
        // {
        //     // fetch all store orders
        // }
        // else
        // {
        //     // fetch all user orders
        // }

        // check if user is the store owner, then propagate all store orders of current date

        socket.on('orders', async (response) => {
            try {
                console.log('📥 Received orders request:', {
                    socketId: socket.id,
                    storeId: socket.handshake.query.storeId,
                    timestamp: new Date().toISOString()
                });

                // this socket is responsible to fetch all orders that are new

                let newOrder = [];
                let accepted = [];
                let preparing = [];
                let dispatched = [];
                let completed = [];
                let delivered = [];
                let cancelled = [];

                socket.emit('connected', 'Connected! Please subscribe to register event now!');


                // adding socket data here
                console.log(socket.handshake.query.storeId);

                let orders = await order.find({ store: mongoose.Types.ObjectId(storeId) }).lean();
                console.log(orders);

                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);

                    if (orderstatus.orderStatus == 'active') {
                        newOrder.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'accepted') {
                        accepted.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'preparing') {
                        preparing.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'pickup') {
                        dispatched.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'completed') {
                        completed.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'delivered') {
                        delivered.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'cancelled') {
                        cancelled.push(orderstatus)
                    }
                }))
                let data = { newOrder: newOrder, accepted: accepted, preparing: preparing, dispatched: dispatched, completed: completed, delivered: delivered, cancelled: cancelled }
                console.log(data);
                socket.emit('orders', data);
                socket.broadcast.emit('orders', data);

                console.log('📤 Sending orders response:', {
                    socketId: socket.id,
                    orderCounts: {
                        new: newOrder.length,
                        accepted: accepted.length,
                        preparing: preparing.length,
                        dispatched: dispatched.length,
                        completed: completed.length,
                        delivered: delivered.length,
                        cancelled: cancelled.length
                    },
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Error processing orders:', {
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('err', error.message);
            }
        })


        socket.on('myOrders', async (response) => {
            try {
                let customer = response.customerId;
                let data = await order.find({ customer: customer }).lean();
                socket.emit('myOrders', data);
                socket.broadcast.emit('myOrders', data);
            }
            catch (error) {
                socket.emit('err', error.message);
            }
        })

        socket.on('onPrepare', async (response) => {
            try {
                let updateOrder = await order.findByIdAndUpdate({
                    _id: mongoose.Types.ObjectId(response.orderid)
                }, {
                    $set: {
                        orderStatus: response.orderStatus,
                        estimatedTime: response.estimatedTime
                    }
                }, {
                    new: true
                });

                // 



                // Check if the order has been active for more than 5 minutes
                const fiveMinutesAgo = new Date(Date.now() - 7 * 60 * 1000);
                if (updateOrder.orderStatus === 'active' && updateOrder.createdAt < fiveMinutesAgo) {
                    updateOrder.orderStatus = 'cancelled';
                    await updateOrder.save();

                    // Notify users about the cancellation
                    const storeData = await stores.findOne({ _id: updateOrder.store });
                    const storeUser = await users.findOne({ _id: storeData.user });
                    const customerData = await users.findOne({ _id: updateOrder.customer });

                    const customerText = `
                        Dear ${customerData.username}, 
                
                        Your Order has been cancelled,
                
                        Order No: ${updateOrder.orderNo}
                
                        https://aimhalal.com/
                    `;

                    const storeText = `
                        Dear ${storeUser.username}, 
                
                        This Order has been cancelled,
                
                        Order No: ${updateOrder.orderNo}
                
                        https://aimhalal.com/login
                    `;

                    await helpers.sendOrderEmail(customerData.email, customerText);
                    await helpers.sendTwilioSMS(`Your Order has been cancelled, Order No: ${data.orderNo}`, customerData.number);
                    await helpers.sendOrderEmail(storeUser.email, storeText);
                    await helpers.sendTwilioSMS(`Order cancelled ${data.orderNo}`, storeUser.number);
                }

                if (updateOrder.orderStatus === 'accepted') {
                    updateOrder.isPending = false;
                    await updateOrder.save();
                }

                let storeData = await stores.findOne({ _id: updateOrder.store });
                let storeUser = await users.findOne({ _id: storeData.user });

                let customerData = await users.findOne({ _id: updateOrder.customer });

                let customerNotification = {
                    title: `Order status has been updated, current status: ${updateOrder.orderStatus}`,
                    notification_for: mongoose.Types.ObjectId(updateOrder._id),
                    user: mongoose.Types.ObjectId(updateOrder.customer),
                    store: mongoose.Types.ObjectId(updateOrder.store),
                    order: updateOrder._id
                }

                // ge

                await helpers.createNotification(customerNotification, customerData);

                // Notify users about the order status update
                let restaurantNotification = {
                    title: `Your Order status has been updated, current status: ${updateOrder.orderStatus}`,
                    notification_for: mongoose.Types.ObjectId(updateOrder._id),
                    user: mongoose.Types.ObjectId(storeUser._id),
                    store: mongoose.Types.ObjectId(storeData._id),
                    order: updateOrder._id
                };
                await helpers.createNotification(restaurantNotification, storeUser);

                // add notification to rider
                if (response.orderStatus == 'accepted') {

                    let riderNotify = await rider.find({})
                    await Promise.all(riderNotify.map(async (e) => {
                        const restaurantNotification = {
                            title: `New Orders`,
                            body: `You have a new order`,
                            notification_for: e._id, // Assuming data is an array
                            user: e._id,
                            store: e._id, // Assuming data is an array
                            order: e._id // Assuming data is an array
                        };
                        await helpers.createNotification(restaurantNotification, e);
                    }))
                }


                // Get updated order data
                let data = await orderService.getOrderById(response.orderid);

                // Broadcast the updated order data
                socket.broadcast.emit('onPrepare', data);

                // Update nearby orders
                let nearbyData = await orderService.nearByOrders({
                    assignRider: null,
                    orderStatus: 'accepted',
                });
                socket.broadcast.emit('nearbyOrder', nearbyData);

                // Separate orders based on status
                let newOrder = [];
                let accepted = [];
                let preparing = [];
                let dispatched = [];
                let completed = [];
                let delivered = [];
                let cancelled = [];

                let orders = await order.find({ store: data.store }).lean();
                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);

                    if (orderstatus.orderStatus == 'active') {
                        newOrder.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'accepted') {
                        accepted.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'preparing') {
                        preparing.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'pickup') {
                        dispatched.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'completed') {
                        completed.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'delivered') {
                        delivered.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'cancelled') {
                        cancelled.push(orderstatus)
                    }
                }));

                let newdata = { newOrder: newOrder, accepted: accepted, preparing: preparing, dispatched: dispatched, completed: completed, delivered: delivered, cancelled: cancelled };
                socket.broadcast.emit('orders', newdata);
                socket.broadcast.emit('singleOrder', data);

                console.log(" NEAR BY EVENT IS CALLED")

            } catch (error) {
                console.error(error);
                socket.broadcast.emit('err', error.message);
            }
        });


        socket.on('nearbyOrder', async (response) => {
            try {
                console.log('📍 Received nearby order request:', {
                    socketId: socket.id,
                    longitude: socket.handshake.query.longitude,
                    latitude: socket.handshake.query.latitude,
                    timestamp: new Date().toISOString()
                });
                const token = response.token;

                const longitude = socket.handshake.query.longitude;
                const latitude = socket.handshake.query.latitude;
                let data = [];

                if (!token) {
                    throw new Error('Token is missing');
                }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate(
                        { _id: riderVerification._id },
                        { $set: { socket: socket.id } },
                        { new: true }
                    );

                    socket.rider = riderVerification;
                }

                if (riderVerification.isActive) {
                    data = await orderService.nearByOrders({
                        assignRider: null,
                        orderStatus: 'accepted',
                        // location: {
                        //     $near: {
                        //         $geometry: { type: "Point", coordinates: [longitude, latitude] },
                        //         $minDistance: 0,
                        //         $maxDistance: 1000
                        //     }
                        // }
                    });

                    // if (data.length > 0) {
                    //     // Notify users about the order status update
                    //     const restaurantNotification = {
                    //         title: `Your Orders`,
                    //         notification_for: data[0]._id, // Assuming data is an array
                    //         user: riderVerification._id,
                    //         store: data[0].store, // Assuming data is an array
                    //         order: data[0]._id // Assuming data is an array
                    //     };
                    //     await helpers.createNotification(restaurantNotification, riderVerification);
                    // }

                    socket.emit('nearbyOrder', data);

                } else {
                    socket.emit('nearbyOrder', []);
                }
            } catch (error) {
                console.error('❌ Error processing nearby order:', {
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('err', { message: error.message });
            }
        });


        socket.on('updateRiderStatus', async (response) => {
            try {
                console.log('🚲 Received rider status update:', {
                    socketId: socket.id,
                    isActive: response.isActive,
                    timestamp: new Date().toISOString()
                });
                const token = response.token;
                const isActive = response.isActive;

                // if (!token) {
                //     throw new Error('Token is missing');
                // }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate({ _id: riderVerification._id }, {
                        $set: { isActive: isActive }
                    }, { new: true });

                    socket.rider = riderVerification;
                } else {
                    throw new Error('Rider authentication error');
                }

                let data = await riderService.getRiderById(riderVerification._id);
                socket.emit('updateRiderStatus', data);
            } catch (error) {
                console.error('❌ Error updating rider status:', {
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('err', { message: error.message });
            }
        });

        socket.on('singleOrder', async (response) => {
            try {
                console.log('🔍 Received single order request:', {
                    socketId: socket.id,
                    orderId: response.orderid,
                    timestamp: new Date().toISOString()
                });
                let data = await orderService.getOrderById(response.orderid);
                socket.emit('singleOrder', data);
                socket.broadcast.emit('singleOrder', data);
            }
            catch (error) {
                console.error('❌ Error fetching single order:', {
                    socketId: socket.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                socket.emit('err', error.message);
            }
        })

        socket.on('review', async (response) => {
            try {
                // get infromation from socket id
                let data = await orderService.getOrderById(response.Order);

                response.store = data.store._id;

                let reviews = new review(response);
                reviews = await reviews.save();
                // get review by id
                socket.emit('singleOrder', data);
            }
            catch (error) {
                socket.emit('err', error.message);
            }
        })

        socket.on('acceptRider', async (response) => {

            try {
                const token = response.token;

                if (!token) {
                    throw new Error('Token is missing');
                }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate({ _id: riderVerification._id }, {
                        $set: { socket: socket.id }
                    }, { new: true });

                    socket.rider = riderVerification;
                } else {
                    throw new Error('Rider authentication error');
                }
                let updateOrder = await order.findByIdAndUpdate({
                    _id: mongoose.Types.ObjectId(response.orderid),
                }, {
                    $set: {
                        assignRider: riderVerification._id,
                        orderStatus: "preparing"
                    }
                }, {
                    new: true
                });


                // hit  a notification to the user, if data is updated

                let orderNotification = {
                    title: "Rider accepted the order",
                    notification_for: mongoose.Types.ObjectId(updateOrder._id),
                    user: mongoose.Types.ObjectId(updateOrder.assignRider),
                    store: mongoose.Types.ObjectId(updateOrder.store),
                    order: updateOrder._id
                }

                await helpers.createNotification(orderNotification);

                let data = await orderService.getOrderById(response.orderid);
                socket.emit('acceptRider', data);
                socket.broadcast.emit('acceptRider', data);

                let nearbyData = await orderService.nearByOrders({
                    orderStatus: 'accepted',
                    assignRider: null
                });

                socket.emit('nearbyOrder', nearbyData);
                socket.broadcast.emit('nearbyOrder', nearbyData);
                socket.broadcast.emit('singleOrder', data);

                let newOrder = [];
                let accepted = [];
                let preparing = [];
                let dispatched = [];
                let completed = [];
                let delivered = [];
                let cancelled = [];

                let orders = await order.find({ store: data.store }).lean();
                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);

                    if (orderstatus.orderStatus == 'active') {
                        newOrder.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'accepted') {
                        accepted.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'preparing') {
                        preparing.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'pickup') {
                        dispatched.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'completed') {
                        completed.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'delivered') {
                        delivered.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'cancelled') {
                        cancelled.push(orderstatus)
                    }
                }))

                let newdata = { newOrder: newOrder, accepted: accepted, preparing: preparing, dispatched: dispatched, completed: completed, delivered: delivered, cancelled: cancelled }
                socket.emit('orders', newdata);
                socket.broadcast.emit('orders', newdata);

                let rideractiveOrder = [];
                let updatedOrders = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(updatedOrders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'preparing') {
                        rideractiveOrder.push(orderstatus)
                    }
                }))

                let updatedData = rideractiveOrder;
                socket.emit('rideractiveOrder', updatedData);


            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit('err', error.message);
            }

        })

        socket.on('pickupOrder', async (response) => {

            try {
                const token = response.token;

                if (!token) {
                    throw new Error('Token is missing');
                }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate({ _id: riderVerification._id }, {
                        $set: { socket: socket.id }
                    }, { new: true });

                    socket.rider = riderVerification;
                } else {
                    throw new Error('Rider authentication error');
                }
                let updateOrder = await order.findByIdAndUpdate({
                    _id: mongoose.Types.ObjectId(response.orderid),
                    orderStatus: 'accepted',
                    assignRider: riderVerification._id
                }, {
                    $set: {
                        orderStatus: 'pickup',
                    }
                }, {
                    new: true
                });


                // hit  a notification to the user, if data is updated

                let orderNotification = {
                    title: "Rider has Picked up your order",
                    notification_for: mongoose.Types.ObjectId(updateOrder._id),
                    user: mongoose.Types.ObjectId(updateOrder.customer),
                    store: mongoose.Types.ObjectId(updateOrder.store),
                    order: updateOrder._id
                }

                await helpers.createNotification(orderNotification);

                let data = await orderService.getOrderById(response.orderid)
                socket.broadcast.emit('orderStatus', data);

                let nearbyData = await orderService.nearByOrders({
                    assignRider: riderVerification._id,
                    orderStatus: 'pickup',
                });

                socket.broadcast.emit('nearbyOrder', nearbyData);
                socket.broadcast.emit('singleOrder', data);

                let newOrder = [];
                let accepted = [];
                let preparing = [];
                let dispatched = [];
                let completed = [];
                let delivered = [];
                let cancelled = [];

                let ordersData = await order.find({ store: data.store }).lean();
                await Promise.all(ordersData.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);

                    if (orderstatus.orderStatus == 'active') {
                        newOrder.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'accepted') {
                        accepted.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'preparing') {
                        preparing.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'pickup') {
                        dispatched.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'completed') {
                        completed.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'delivered') {
                        delivered.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'cancelled') {
                        cancelled.push(orderstatus)
                    }
                }))

                let newUpdatedData = { newOrder: newOrder, accepted: accepted, preparing: preparing, dispatched: dispatched, completed: completed, delivered: delivered, cancelled: cancelled }
                socket.emit('orders', newUpdatedData);
                socket.broadcast.emit('orders', newUpdatedData);

                let pickup = [];
                let orders = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'pickup') {
                        pickup.push(orderstatus)
                    }
                }))

                let newdata = pickup;
                socket.emit('riderPickup', newdata);

                let rideractiveOrder = [];
                let updatedOrders = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(updatedOrders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'preparing') {
                        rideractiveOrder.push(orderstatus)
                    }
                }))

                let updatedData = rideractiveOrder;
                socket.emit('rideractiveOrder', updatedData);

            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit('err', error.message);
            }

        })
        socket.on('dropoffOrder', async (response) => {

            try {
                const token = response.token;

                if (!token) {
                    throw new Error('Token is missing');
                }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate({ _id: riderVerification._id }, {
                        $set: { socket: socket.id }
                    }, { new: true });

                    socket.rider = riderVerification;
                } else {
                    throw new Error('Rider authentication error');
                }
                let updateOrder = await order.findByIdAndUpdate({
                    _id: mongoose.Types.ObjectId(response.orderid),
                    orderStatus: 'pickup',
                    assignRider: riderVerification._id
                }, {
                    $set: {
                        orderStatus: 'delivered',
                    }
                }, {
                    new: true
                });


                // hit  a notification to the user, if data is updated

                let orderNotification = {
                    title: "Order has been delivered",
                    notification_for: mongoose.Types.ObjectId(updateOrder._id),
                    user: mongoose.Types.ObjectId(updateOrder.customer),
                    store: mongoose.Types.ObjectId(updateOrder.store),
                    order: updateOrder._id
                }

                await helpers.createNotification(orderNotification);

                let data = await orderService.getOrderById(response.orderid)
                socket.broadcast.emit('orderStatus', data);

                let nearbyData = await orderService.nearByOrders({
                    assignRider: riderVerification._id,
                    orderStatus: 'delivered',
                });

                socket.broadcast.emit('nearbyOrder', nearbyData);
                socket.broadcast.emit('singleOrder', data);

                let newOrder = [];
                let accepted = [];
                let preparing = [];
                let completed = [];
                let delivered = [];
                let cancelled = [];

                let orders = await order.find({ store: data.store }).lean();
                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);

                    if (orderstatus.orderStatus == 'active') {
                        newOrder.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'accepted') {
                        accepted.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'preparing') {
                        preparing.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'completed') {
                        completed.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'delivered') {
                        delivered.push(orderstatus)
                    }
                    if (orderstatus.orderStatus == 'cancelled') {
                        cancelled.push(orderstatus)
                    }
                }))

                let newdata = { newOrder: newOrder, accepted: accepted, preparing: preparing, completed: completed, delivered: delivered, cancelled: cancelled }
                socket.emit('orders', newdata);
                socket.broadcast.emit('orders', newdata);

                let deliveredOrder = [];
                let updatedOrder = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(updatedOrder.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'delivered') {
                        deliveredOrder.push(orderstatus)
                    }
                }))

                let updatedData = deliveredOrder;
                socket.emit('deliveredOrder', updatedData);

                let pickup = [];
                let updatedPickup = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(updatedPickup.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'pickup') {
                        pickup.push(orderstatus)
                    }
                }))

                let updatedpickData = pickup;
                socket.emit('riderPickup', updatedpickData);

            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit('err', error.message);
            }

        })

        socket.on('deliveredOrder', async (response) => {

            try {
                const token = response.token;

                if (!token) {
                    throw new Error('Token is missing');
                }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate({ _id: riderVerification._id }, {
                        $set: { socket: socket.id }
                    }, { new: true });

                    socket.rider = riderVerification;
                } else {
                    throw new Error('Rider authentication error');
                }
                let delivered = [];
                let orders = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'delivered') {
                        delivered.push(orderstatus)
                    }
                }))

                let newdata = delivered;
                socket.emit('deliveredOrder', newdata);
                socket.broadcast.emit('deliveredOrder', newdata);

            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit('err', error.message);
            }

        })

        socket.on('riderPickup', async (response) => {

            try {
                const token = response.token;

                if (!token) {
                    throw new Error('Token is missing');
                }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate({ _id: riderVerification._id }, {
                        $set: { socket: socket.id }
                    }, { new: true });

                    socket.rider = riderVerification;
                } else {
                    throw new Error('Rider authentication error');
                }
                let pickup = [];
                let orders = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'pickup') {
                        pickup.push(orderstatus)
                    }
                }))

                let newdata = pickup;
                socket.emit('riderPickup', newdata);

            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit('err', error.message);
            }

        })

        socket.on('rideractiveOrder', async (response) => {

            try {
                const token = response.token;

                if (!token) {
                    throw new Error('Token is missing');
                }

                let riderVerification = await authentication.verifyRiderSocket(token);

                if (riderVerification) {
                    riderVerification = await rider.findByIdAndUpdate({ _id: riderVerification._id }, {
                        $set: { socket: socket.id }
                    }, { new: true });

                    socket.rider = riderVerification;
                } else {
                    throw new Error('Rider authentication error');
                }
                let rideractiveOrder = [];
                let orders = await order.find({ assignRider: riderVerification._id }).lean();
                await Promise.all(orders.map(async (e) => {
                    let orderstatus = await orderService.getOrderById(e._id);
                    if (orderstatus.orderStatus == 'preparing') {
                        rideractiveOrder.push(orderstatus)
                    }
                }))

                let newdata = rideractiveOrder;
                socket.emit('rideractiveOrder', newdata);

            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit('err', error.message);
            }

        })

        socket.on('useLocation', async (response) => {
            let longitudeData = response.longitude;
            let latitudeData = response.latitude;


            let location = { type: "Point", coordinates: [longitudeData ? longitudeData : 0, longitudeData ? latitudeData : 0] };
            try {
                let updateOrder = await rider.findByIdAndUpdate({
                    _id: mongoose.Types.ObjectId(response.riderid)
                }, {
                    $set: {
                        longitude: longitudeData,
                        latitude: latitudeData
                    }
                }, {
                    new: true
                });

                await order.updateMany({
                    assignRider: mongoose.Types.ObjectId(response.riderid)
                }, {
                    $set: {
                        riderLocation: location
                    }
                }, {
                    new: true
                });

                // Get current time and time 1 hour ago
                const now = new Date();
                const oneHourAgo = moment().subtract(1, 'hour').toDate();

                // Query orders from the last hour
                const recentOrders = await order.find({
                    createdAt: {
                        $gte: oneHourAgo,
                        $lt: now
                    }
                });


                // Emit each order individually
                recentOrders.forEach(async order => {
                    let data = await orderService.getOrderById(order._id)
                    socket.broadcast.emit('singleOrder', data);
                });

                // hit  a notification to the user, if data is updated

                // let orderNotification = {
                //     title: "Rider has Picked up your order",
                //     notification_for: mongoose.Types.ObjectId(updateOrder._id),
                //     user: mongoose.Types.ObjectId(updateOrder.customer),
                //     store: mongoose.Types.ObjectId(updateOrder.store),
                //     order: updateOrder._id
                // }

                // await helpers.createNotification(orderNotification);

                // let data = await orderService.getOrderById(response.orderid)
                socket.broadcast.emit('useLocation', location);

            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit('err', error.message);
            }

        })

        // Add your event handlers here

        socket.on('disconnect', () => {
            console.log('📤 Order socket disconnected:', {
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
        });
    });
}

function isValidToken(token) {
    // Implement your token validation logic here
    // For example, check if the token is present and valid
    const jwtSecret = process.env.JWT_SECRET || 'aimhalal_default_jwt_secret_key_2024';
    try {
        jwt.verify(token, jwtSecret);
        return true;
    } catch (error) {
        return false;
    }
}

export default {
    initOrder,
    getIoInstance
}