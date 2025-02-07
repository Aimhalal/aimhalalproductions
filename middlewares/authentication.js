import JwtService from "../services/jwt.js";
import userService from "../services/user.js";
import riderService from "../services/rider.js";
import users from "../models/users.js";
import jwt from "jsonwebtoken";

async function verifyAuthToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    req.token = bearerHeader.split(" ")[1];

    // Validating Token
    let invalidToken = false;
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
      if (err) {
        invalidToken = true;
        return res
          .status(401)
          .json({
            status: "error",
            message:
              "Malformed sign-in token! Please use a valid sign-in token to continue.",
            data: null,
          });
      } else {
        req.user = await userService.getUserById(authData.id);

        if (!req.user)
          return res.status(403).json({
            status: "error",
            message: "Invalid sign-in token! Please log-in again to continue.",
            data: null,
          });
        next();
      }
    });
    if (invalidToken) return;
  } else {
    return res
      .status(401)
      .json({
        status: "error",
        message: "Please use a sign-in token to access this request.",
        data: null,
      });
  }
}

async function verifyRiderAuth(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    req.token = bearerHeader.split(" ")[1];

    // Validating Token
    let invalidToken = false;
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
      if (err) {
        invalidToken = true;
        return res
          .status(401)
          .json({
            status: "error",
            message:
              "Malformed sign-in token! Please use a valid sign-in token to continue.",
            data: null,
          });
      } else {
        req.user = await riderService.getRiderById(authData.id);

        if (!req.user)
          return res.status(403).json({
            status: "error",
            message: "Invalid sign-in token! Please log-in again to continue.",
            data: null,
          });
        next();
      }
    });
    if (invalidToken) return;
  } else {
    return res
      .status(401)
      .json({
        status: "error",
        message: "Please use a sign-in token to access this request.",
        data: null,
      });
  }
}

async function verifySocket(token) {
  return new Promise((resolve, reject) => {
    if (token !== "undefined") {
      // Validating Token
      jwt.verify(token, process.env.JWT_SECRET, async (err, authData) => {
        if (err) {
          console.log(err);
          reject(
            "Malformed sign-in token! Please use a valid sign-in token to continue."
          );
        } else {
          try {
            const user = await userService.getUserById(authData.id);

            if (!user) {
              reject("User not found");
            } else {
              resolve(user);
            }
          } catch (error) {
            reject("Error fetching user data");
          }
        }
      });
    } else {
      reject("Please use a sign-in token to access this request.");
    }
  });
}

async function verifyRiderSocket(token) {
  return new Promise((resolve, reject) => {
    if (token !== "undefined") {
      // Validating Token
      jwt.verify(token, process.env.JWT_SECRET, async (err, authData) => {
        if (err) {
          console.log(err);
          reject(
            "Malformed sign-in token! Please use a valid sign-in token to continue."
          );
        } else {
          try {
            const rider = await riderService.getRiderById(authData.id);
            console.log(authData.id);

            if (!rider) {
              reject("User not found");
            } else {
              resolve(rider);
            }
          } catch (error) {
            reject("Error fetching rider data");
          }
        }
      });
    } else {
      reject("Please use a sign-in token to access this request.");
    }
  });
}

export default {
  verifyAuthToken,
  verifyRiderAuth,
  verifySocket,
  verifyRiderSocket,
};
