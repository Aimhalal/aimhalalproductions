import mongoose from "mongoose";

const prayerTimeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  fajr: {
    type: Date,
    required: true,
  },
  dhuhr: {
    type: Date,
    required: true,
  },
  asr: {
    type: Date,
    required: true,
  },
  maghrib: {
    type: Date,
    required: true,
  },
  isha: {
    type: Date,
    required: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  timeZone: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export const PrayerTime = mongoose.model("PrayerTime", prayerTimeSchema);
