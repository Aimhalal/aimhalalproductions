import axios from "axios";
import { PrayerTime } from "../models/prayerTime.js";
import { CronJob } from "cron";
import moment from "moment";
import Admin from "firebase-admin";
import helpers from "../utils/helpers.js";

const fetchPrayerTimes = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://api.aladhan.com/v1/timings`, {
      params: {
        latitude,
        longitude,
        method: 2,
        school: 0,
        timezonestring: "UTC", // Set the timezone to UTC
      },
    });

    const timings = response.data.data.timings;
    const dateToday = moment().utc().format("YYYY-MM-DD"); // Ensure the date is in UTC

    const convertToDate = (timeString) => {
      return moment(`${dateToday} ${timeString}`, "YYYY-MM-DD HH:mm").toDate();
    };

    return {
      fajr: convertToDate(timings.Fajr),
      dhuhr: convertToDate(timings.Dhuhr),
      asr: convertToDate(timings.Asr),
      maghrib: convertToDate(timings.Maghrib),
      isha: convertToDate(timings.Isha),
    };
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    throw error;
  }
};

const updatePrayerTimes = async (userId, latitude, longitude) => {
  const prayerTimes = await fetchPrayerTimes(latitude, longitude);
  console.log(prayerTimes);

  const updatedPrayer = await PrayerTime.findOneAndUpdate(
    { userId },
    {
      fajr: prayerTimes.fajr,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      location: { latitude, longitude },

      date: new Date(),
    },
    { upsert: true, new: true }
  );

  if (!updatedPrayer) {
    console.log("Prayer times not updated");
  }
  return prayerTimes;
};

const sendNotification = async (prayerName, fcmToken) => {
  try {
    // await Admin.messaging().send(message);
    const notifi = await helpers.sendTestNotification(fcmToken);
    console.log(`Successfully sent ${prayerName} notification`);
  } catch (error) {
    console.error(`Error sending ${prayerName} notification`, error);
  }
};

const scheduleNotifications = (prayerTimes, userId, fcmToken) => {
  const schedulePrayerNotification = (prayerTime, prayerName) => {
    const now = new Date();
    if (prayerTime > now) {
      new CronJob(
        prayerTime,
        () => sendNotification(prayerName, fcmToken),
        null,
        true,
        null
      );
    } else {
      console.log(
        `Skipping ${prayerName} notification as the time is in the past.`
      );
    }
  };

  schedulePrayerNotification(prayerTimes.fajr, "Fajr");
  schedulePrayerNotification(prayerTimes.dhuhr, "Dhuhr");
  schedulePrayerNotification(prayerTimes.asr, "Asr");
  schedulePrayerNotification(prayerTimes.maghrib, "Maghrib");
  schedulePrayerNotification(prayerTimes.isha, "Isha");
};

const updateMain = async (userId, latitude, longitude, fcmToken) => {
  try {
    const prayerTimes = await updatePrayerTimes(userId, latitude, longitude);
    scheduleNotifications(prayerTimes, userId, fcmToken);
  } catch (error) {
    console.log("Error in updateMain:", error.message);
  }
};

const updateMainTest = async (userId, latitude, longitude, fcmToken) => {
  try {
    const prayerTimes = await updatePrayerTimes(userId, latitude, longitude);
    return prayerTimes;
  } catch (error) {
    console.log("Error in updateMain:", error.message);
  }
};

export { updateMain, updateMainTest };
