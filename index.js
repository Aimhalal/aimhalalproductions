import express from "express";
import dotenv from "dotenv";
// import Users from "./models/users.js";
import mongoose from "mongoose";
import fileUpload from "express-fileupload";
import { fs } from "file-system";
import upload from "express-fileupload";
import { PrayerTime } from "./models/prayerTime.js";
import path from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import cors from "cors";
import admin from "./routes/admin.js";
import authentication from "./routes/authentication.js";
import vendor from "./routes/vendor.js";
import appRoute from "./routes/app.js";
import webRoute from "./routes/web.js";
import riderRoute from "./routes/rider.js";

// import sockets

import orderSocket from "./socket/order.js";
import helpers from "./utils/helpers.js";
import ingredients from "./models/ingredients.js";

import axios from "axios";
import stores from "./models/stores.js";
import slugify from "slugify";

dotenv.config();

var PORT = process.env.PORT,
  DB_URL = process.env.DB_URL;

console.clear();
mongoose.connect(DB_URL, (err, db) => {
  if (err) console.error(err);
  console.log("DB Connected Successfully");
});

const app = express();
app.use(express.json({ limit: "10000mb" }));

// Enable CORS for all origins explicitly
app.use(
  cors({
    origin: "*",
  })
);

app.set("view engine", "ejs");
// app.use(fileUpload());
app.use(upload());
app.use(express.static("public"));
app.use(express.static("well-known"));

app.use(express.static(path.join(__dirname, "web")));

// route to remove items that are not is supermenu

app.use("/api/admin", admin);
app.use("/api/auth", authentication);
app.use("/api/vendor", vendor);
app.use("/api/app", appRoute);
app.use("/api/web", webRoute);
app.use("/api/rider", riderRoute);

app.use("/domains", async (req, res) => {
  let domains = {
    app: "http://167.99.49.197:3000",
    orderSocket: "http://167.99.49.197:5401",
  };
  return res.json(domains);
});

app.post("/getPrayer-now/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const timing = await PrayerTime.findById({ _id: id });

  return res.status(200).json(timing);
});

app.get("/send-sms", async (req, res) => {
  let sendSm = await helpers.vonageSmsIntegration("966566935647");
  return res.json({});
});

app.get("/fix-character", async (req, res) => {
  try {
    const data = await ingredients.find({});

    for (const ingredient of data) {
      if (ingredient.type) {
        ingredient.type = capitalizeFirstLetter(ingredient.type);
        await ingredient.save();
      }
    }

    res.json({
      status: 200,
      message: "Types updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

app.get("/send-email", async (req, res) => {
  let data = await helpers.sendNewsletter("abdulmaroofyousfani5@gmail.com");
  return res.json({});
});

import users from "./models/users.js";

// test apis
import PrayerTimeDone from "./routes/prayerTime.js";
import ingredientList from "./routes/ingredientList.js";
import payByCard from "./routes/payByCard.js";
import { updateMainTest } from "./controllers/prayerTime.js";

app.post("/servertime", async (req, res) => {
  const { userId, latitude, longitude, fcmToken } = req.body;
  return res.status(200).json({
    serverTime: new Date(),
    PrayerTime: await updateMainTest(userId, latitude, longitude, fcmToken),
  });
});

app.use("/update-location", PrayerTimeDone);

app.post("/api/ingredient-type", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "All Fields are Required" });
    }

    return res.status(200).json({
      success: true,
      data: { type: "HALAL" },
      message: "Data Sent Successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: "Unhandled Error" });
  }
});

app.post("/api/adhan-subscribers", async (req, res) => {
  try {
    const { email, fcmToken } = req.body;

    const dataNew = await users.findOne({ email });
    let data;
    if (fcmToken) {
      data = await helpers.sendTestNotification(fcmToken);
    } else {
      data = await helpers.sendTestNotification(dataNew.fcmToken);
    }

    if (data == false) {
      return res.json({
        status: 400,
        message: "failure",
        error: "Notification Not Sent",
      });
    }

    return res.json({
      status: 200,
      message: "success",
      data: "Push Notification sent Successfully",
      dataval: data,
    });
  } catch (error) {
    return res.json({
      status: 400,
      message: "failure",
      error: error,
    });
  }
});

app.use("/api/ingredient-list", ingredientList);
app.use("/api/pay-by-card", payByCard);

app.post("/send-test-notification", async (req, res) => {
  let data = await helpers.sendTestNotification(req.query.fcmToken);

  return res.json({});
});

app.get("/alter", async (req, res) => {
  const Store = await stores.find();

  // Iterate through each entry
  for (const store of Store) {
    // Swap the latitude and longitude coordinates
    const [latitude, longitude] = store.location.coordinates;

    console.log(store.store_name, latitude, longitude);
    // store.location.coordinates = [longitude, latitude];

    console.log(`Updated location for store ${store._id}`);

    // // Update the entry with the new location
    // await store.save();
    // console.log(`Updated location for store ${store._id}`);
  }
});

app.get("/verify-address", async (req, res) => {
  let address = "Suite 1400, 18 King Street East Toronto, ON, Canada";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${process.env.Map_API}`;
  const response = await axios.get(url);
  if (response.data.status !== "OK") {
    return res.json({
      status: 500,
      message: `Invalid Address ${req.body.location}`,
      data: {},
    });
  }
  const location = response.data.results[0].geometry.location;
  // req.body.latitude = location.lat;
  // req.body.longitude = location.lng

  return res.json({ status: 400 });
});

app.get("/verify-twilio", async (req, res) => {
  try {
    let data = await helpers.sendTwilioOtp(123, "+923353557178");
    return res.json({
      data,
    });
  } catch (error) {
    return res.json({
      error,
    });
  }
});

app.get("/verify-number-vonage", async (req, res) => {
  try {
  } catch (error) {}
});

// initialize sockets

orderSocket.initOrder();

// Ending initialize sockets

// App Routes

app.get("/", (req, res) => res.send("Welcome to the Aim Halal Api Gateway"));

async function getRamadanPrayerTimes(
  latitude,
  longitude,
  startYear,
  startMonth,
  endYear,
  endMonth
) {
  const url = `http://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=2&annual=true&start=${startYear}-${startMonth}&end=${endYear}-${endMonth}`;

  try {
    const response = await axios.get(url);
    const ramadanData = response.data.data;
    return ramadanData;
  } catch (error) {
    throw new Error("Error fetching Ramadan prayer times:", error.message);
  }
}

app.post("/api/ramadan", async (req, res) => {
  let { longitude, latitude, startYear, startMonth, endYear, endMonth } =
    req.body;

  try {
    const ramadanData = await getRamadanPrayerTimes(
      latitude,
      longitude,
      startYear,
      startMonth,
      endYear,
      endMonth
    );
    return res.json({
      status: 200,
      message: "success",
      data: ramadanData,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/ramazan/prayertime", async (req, res) => {
  let {
    latitude,
    longitude,
    startYear,
    startMonth,
    startDay,
    endYear,
    endMonth,
    endDay,
  } = req.body;
  // Convert latitude and longitude to numbers
  latitude = parseFloat(latitude).toFixed(5);
  longitude = parseFloat(longitude).toFixed(5);

  // Format latitude and longitude to 5 decimal places and convert to strings
  // latitude = latitude.toFixed(5);
  // longitude = longitude.toFixed(5);

  // Construct the API URL using the provided start and end dates
  const url = `http://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=2&school=0&annual=true&start=${startYear}-${startMonth}-${startDay}&end=${endYear}-${endMonth}-${endDay}`;

  try {
    const response = await axios.get(url);
    const responseData = response?.data.data;

    // Extract data for the entire month
    const dataForMonth = [];
    for (let month = startMonth; month <= endMonth; month++) {
      const daysInMonth = responseData[+month];
      for (let i = startDay; i <= endDay; i++) {
        dataForMonth.push(daysInMonth[i - 1]);
      }
    }

    return res.json({
      status: 200,
      message: "success",
      data: dataForMonth,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/ramazan/calender", async (req, res) => {
  const {
    latitude,
    longitude,
    startYear,
    startMonth,
    startDay,
    endYear,
    endMonth,
    endDay,
  } = req.body;
  const url = `http://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=2&annual=true&start=${startYear}-${startMonth}-${startDay}&end=${endYear}-${endMonth}-${endDay}`;
  try {
    const response = await axios.get(url);
    const monthlyData = response.data.data;

    const simplifiedData = [];
    for (const month in monthlyData) {
      for (const dayData of monthlyData[month]) {
        const { gregorian } = dayData.date;
        const day = parseInt(gregorian.day);
        const monthNumber = parseInt(gregorian.month.number);
        // Check if the date is between March 12 and April 12
        if (
          (monthNumber === 3 && day >= 12) ||
          (monthNumber === 4 && day <= 10)
        ) {
          simplifiedData.push(dayData);
        }
      }
    }

    return res.json({
      status: 200,
      message: "success",
      data: simplifiedData,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/fix-openings", async (req, res) => {
  try {
    let data = await stores.find({});
    await Promise.all(
      data.map(async (store) => {
        await Promise.all(
          store.opening_hours.map((opening) => {
            if (opening.day === "Sunday" || opening.day === "Saturday") {
              opening.on = false;
            } else {
              opening.on = true;
            }
          })
        );
        await store.save(); // Save the changes to the database
      })
    );
    return res.json(data);
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
});

app.post("/test-fcm", async (req, res) => {
  try {
    let tokens = req.body.tokens;
    console.log("Request System");

    console.log(req.body);

    console.log("GET TOKENS");

    console.log("TOKENS");

    await Promise.all(
      tokens.map(async (e) => {
        console.log(req.body.title);

        console.log(req.body.body);

        console.log("TOKEN");
        console.log(e);

        let testToken = await helpers.createNotification(
          {
            title: req.body.title,
            body: req.body.body,
          },
          e
        );

        return e;
      })
    );
    return res.json({
      status: 200,
      message: "success",
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
    });
  }
});

app.get("/test-fcm2", async () => {
  try {
    let testToken = await helpers.createNotification(
      "e6_ecGaUQAuJcMHO2BCLUc:APA91bEQkcJKCp6e4WjRFqGVnTv2gaSux-2Gyt93foIE6CED-tRrC_ySD4gZGGgmw2FdEc2MHrNSv8xDkRuffajtGM1Qi1no0RU2FxqAezyt6DzT71IvjIhMefOEn4_upbU6wrqBGE5_"
    );
    console.log(testToken);
  } catch (error) {
    console.log(error);
  }
});

app.get("/add-slug", async (req, res) => {
  try {
    let Store = await stores.find({});
    await Promise.all(
      Store.map(async (st) => {
        let slug = slugify(st.store_name, { lower: true }); // Create slug from store name
        st.slug = slug; // Assign slug to store document
        console.log(slug);
        await st.save(); // Save the updated document
      })
    );
    res.status(200).send("Slugs added successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding slugs");
  }
});

// For Admin Panel UI
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "web", "index.html"));
});

app.post("/convert-uri-to-png", (req, res) => {
  const { dataUri } = req.body;

  // if (!dataUri || !dataUri.startsWith('data:image/png;base64,')) {
  //     return res.status(400).send('Invalid Data URI');
  // }

  // Extract the Base64 string
  const base64Data = dataUri;

  // Define the output path for the PNG file
  const outputPath = path.join(__dirname, "output.png");

  // Decode and save the binary data
  fs.writeFile(outputPath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error saving PNG file:", err);
      return res.status(500).send("Error saving PNG file");
    }
    res.send("PNG file saved successfully");
  });
});

// app.all("*", (req, res) => res.status(404).send("You've tried reaching a route that doesn't exist."));

app.listen(PORT, () =>
  console.log(`Server running on port: http://localhost:${PORT}`)
);
