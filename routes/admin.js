import express from "express";
const router = express.Router();
import role from "../controllers/role.js";
import user from "../controllers/user.js";
import category from "../controllers/category.js";
import faq from "../controllers/faq.js";
import authentication from "../middlewares/authentication.js";
import store from "../controllers/store.js";
import post from "../controllers/post.js";
import admin from "../controllers/admin.js";
import page from "../controllers/page.js";
import banner from "../controllers/banner.js";
import promotion from "../controllers/promotion.js";
import activity from "../middlewares/activity.js";
import rider from "../controllers/rider.js";

// Admin HomePage

router.get("/home", authentication.verifyAuthToken, admin.home);
router.get("/analytics", authentication.verifyAuthToken, admin.analytics);

// Admin Ending Homepage

// Roles section
router.post("/roles", role.store);
router.get("/roles/vendor", role.getVendorTypes);
router.get("/roles/vendor1", category.listStoreCategory);
router.get("/roles/categorywithStoresCount", category.categorywithStoresCount);
router.get("/roles/vendor-updated", role.getUpdatedVendors);

// store requests

router.get("/stores", user.index);
router.post("/stores/accept", user.acceptRequest);

// rider requests
router.get("/stores/view", authentication.verifyAuthToken, rider.view);
router.post(
  "/stores/rider/accept",
  authentication.verifyAuthToken,
  rider.acceptRequest
);
router.get(
  "/stores/viewApproved",
  authentication.verifyAuthToken,
  rider.viewApproved
);
router.delete(
  "/stores/deleteRider/:id",
  authentication.verifyAuthToken,
  rider.deleteRider
);
router.post(
  "/stores/rider/block",
  authentication.verifyAuthToken,
  rider.blockRider
);
router.get("/stores/rider/:id", authentication.verifyAuthToken, rider.getRider);
router.post(
  "/stores/acceptVehicle/:vehicleid",
  authentication.verifyAuthToken,
  rider.acceptVehicle
);
router.get(
  "/stores/viewVehicleRequest",
  authentication.verifyAuthToken,
  rider.viewVehicleRequest
);

// categories
router.post("/category", authentication.verifyAuthToken, category.store);
router.delete("/category", category.deleteCategory);
router.put("/category/:id", category.update);
router.get("/category", category.index);

router.post(
  "/category/store",
  authentication.verifyAuthToken,
  category.addStoreCategory
);
router.get(
  "/category/store",
  authentication.verifyAuthToken,
  category.listStoreCategory
);
router.delete(
  "/category/store/:id",
  authentication.verifyAuthToken,
  category.deleteStoreCategory
);
router.put(
  "/category/store/:id",
  authentication.verifyAuthToken,
  category.editStoreCategory
);

// Vendors FAQS

router.post("/faq", authentication.verifyAuthToken, faq.store);

router.get("/faq", faq.index);
router.put("/faq/update", authentication.verifyAuthToken, faq.update);

// All Partners

router.get("/partners", authentication.verifyAuthToken, store.allPartners);
router.get(
  "/partners/:id",
  authentication.verifyAuthToken,
  store.getSinglePartner
);

router.delete(
  "/remove-store/:id",
  authentication.verifyAuthToken,
  store.removeStore
);

// ending partners

// track Customers

router.get("/customers", authentication.verifyAuthToken, user.userActivities);
router.post(
  "/customers/block",
  authentication.verifyAuthToken,
  user.toggleUserStatus
);
router.get(
  "/customers/:id/orders",
  authentication.verifyAuthToken,
  user.singleUserActivity
);

// Ending Customers section

// Create and Remove Posts

router.post("/posts", authentication.verifyAuthToken, post.store);
router.put("/posts/:id", authentication.verifyAuthToken, post.update);
router.get("/posts", post.index);
router.get("/adminPosts", post.adminPosts);
router.get("/posts/:id", post.single);
router.delete("/posts/:id", post.destroy);

// Pages
router.post("/page", authentication.verifyAuthToken, page.store);
router.get("/page", page.index);
router.get("/page/:id", page.view);
router.put("/page/:id", page.update);

// Ending Pages

// Settings

router.put(
  "/store/picture",
  authentication.verifyAuthToken,
  admin.updateProfile
);
router.put(
  "/store/settings",
  authentication.verifyAuthToken,
  admin.updateSettings
);

// Admin Newsletter

router.get("/news-letter", authentication.verifyAuthToken, admin.newsletter);

router.post(
  "/language-setup",
  authentication.verifyAuthToken,
  admin.storeLanguage
);
router.get(
  "/language-setup",
  authentication.verifyAuthToken,
  admin.listLanguages
);

// Ingredients

router.post(
  "/ingredients",
  authentication.verifyAuthToken,
  admin.importIngredients
);
router.get(
  "/ingredients",
  authentication.verifyAuthToken,
  admin.getIngredients
);

//

router.post("/banner", authentication.verifyAuthToken, banner.create);
router.get("/banner", banner.all);
router.get("/banner/all", banner.view);

router.put("/banner/:id", authentication.verifyAuthToken, banner.update);
router.delete("/banner/:id", authentication.verifyAuthToken, banner.destroy);
router.put(
  "/banner/archive/:id",
  authentication.verifyAuthToken,
  banner.setArchive
);

// Promotions

router.get(
  "/promotions",
  authentication.verifyAuthToken,
  promotion.adminPromotions
);
router.post(
  "/promotions",
  authentication.verifyAuthToken,
  promotion.adminStoreBanner
);
router.put(
  "/promotions/:id",
  authentication.verifyAuthToken,
  promotion.adminUpdatePromotion
);
router.delete(
  "/promotions/:id",
  authentication.verifyAuthToken,
  promotion.destroy
);
router.get("/stores/:search", promotion.search);

// Ending Promotions

// Create Store By Admin

router.post(
  "/store",
  [authentication.verifyAuthToken, activity.logActivity],
  admin.store
);

router.put("/update/:id", authentication.verifyAuthToken, admin.updateData);

// Activity Log
router.get("/logs", [authentication.verifyAuthToken], admin.logs);

export default router;
