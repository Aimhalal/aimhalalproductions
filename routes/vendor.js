import express from "express";
const router = express.Router();
import store from "../controllers/store.js";
import item from "../controllers/item.js";

import order from "../controllers/order.js";
import authentication from "../middlewares/authentication.js";
import faq from "../controllers/faq.js";
import vendor from "../controllers/vendor.js";
import promotion from "../controllers/promotion.js";
import notification from "../controllers/notification.js";
import category from "../controllers/category.js";

// store creation

router.post("/store", authentication.verifyAuthToken, store.store);
router.put(
  "/store/picture",
  authentication.verifyAuthToken,
  store.updateProfile
);
router.put(
  "/store/settings",
  authentication.verifyAuthToken,
  store.updateSettings
);
router.put(
  "/store/profile",
  authentication.verifyAuthToken,
  store.updateStoreProfile
);
router.put(
  "/store/availability",
  authentication.verifyAuthToken,
  store.availability
);
router.put(
  "/store/convertData",
  authentication.verifyAuthToken,
  store.convertDataToImage
);

// My Store Section

router.get("/my-store", authentication.verifyAuthToken, store.myStore);

router.get("/store/faq", faq.index);

// Store ending here

// create items from the store

router.post("/item", authentication.verifyAuthToken, item.store);
router.put("/item/:id", authentication.verifyAuthToken, item.update);
router.get("/item/all", authentication.verifyAuthToken, item.getAll);
router.get("/item/:id", item.view);
router.delete("/item/:id", authentication.verifyAuthToken, item.destroy);

router.get(
  "/item/bulk-export",
  authentication.verifyAuthToken,
  item.bulkExport
);
router.post(
  "/item/bulk-import",
  authentication.verifyAuthToken,
  item.bulkImport
);

router.post(
  "/item/digital",
  authentication.verifyAuthToken,
  item.uploadDigitalMenu
);
router.delete(
  "/item/digital/:id",
  authentication.verifyAuthToken,
  item.editDigitalMenu
);

// items section ending here

// create promotion vendor

router.post("/promotion", authentication.verifyAuthToken, promotion.store);
router.put("/promotion/:id", authentication.verifyAuthToken, promotion.update);
router.delete(
  "/promotion/:id",
  authentication.verifyAuthToken,
  promotion.destroy
);

router.get("/promotion", authentication.verifyAuthToken, promotion.all);

// endign Vendor Promotions

// Order section vendor

router.get("/orders", authentication.verifyAuthToken, order.vendorOrders);
router.get("/orders/:id", authentication.verifyAuthToken, order.view);
router.post(
  "/orders/status/:id",
  authentication.verifyAuthToken,
  order.updateOrderStatus
);

// Order Section Vendor

// Products Section Vendor

router.get("/menus", authentication.verifyAuthToken, item.all);
router.get("/menus/category/:id", item.itembyCategoryId);

// ending product Section fro vendors

// Home Page Vendor

router.get("/", authentication.verifyAuthToken, vendor.home);
router.get("/analytics", authentication.verifyAuthToken, vendor.analytics);

// Ending HomePage

// Get Store notifications

router.get(
  "/notifications",
  authentication.verifyAuthToken,
  notification.getNotificationByStore
);

// Remove Category From the store

router.delete(
  "/product/:id/category/:categoryId",
  authentication.verifyAuthToken,
  category.deleteProductCategory
);
router.delete(
  "/category/:id",
  authentication.verifyAuthToken,
  category.deleteCategoryFromStore
);

export default router;
