import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  title: {
    type: String,
  },
  body: {
    type: String,
  },
  type: {
    type: String,
    default: "order",
  },
  data: {
    type: mongoose.Types.ObjectId,
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  order: {
    type: mongoose.Types.ObjectId,
    ref: "orders",
    default: null,
  },
  notification_for: {
    type: mongoose.Types.ObjectId,
    default: null,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "user",
    default: null,
  },
  readStatus: {
    type: Number,
    default: 0,
    //0 = unread, 1 = read
  },
  store: {
    type: mongoose.Types.ObjectId,
    ref: "store",
    default: null,
  },
  url: {
    type: String,
    default: "",
  },
});
export default mongoose.model("notifications", notificationSchema);
