import express from "express";
const router = express.Router();
import authentication from "../controllers/authentication.js";

router.post("/", authentication.store);
router.post("/login", authentication.login);
router.post("/guest-login", authentication.guestLogin);

router.post("/adminUser", authentication.adminUser);

// password

router.post("/request-password", authentication.requestForgetPassword);
router.post("/verify-otp", authentication.verifyOtp);
router.post("/resend-otp", authentication.resendOtp);
router.post("/change-password", authentication.changePassword);

// App Change Password Request

// Change Password

router.post(
  "/app/change-password-request",
  authentication.changePasswordRequest
);
router.post("/app/change-password-verify", authentication.changePasswordVerify);

router.post("/app/save-address", authentication.saveAddress);
router.get("/get-address/:userId", authentication.getAddress);

export default router;
