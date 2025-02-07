import express from "express";
import authentication from "../middlewares/authentication.js";
import order from "../controllers/order.js";
import app from "../controllers/app.js";
import store from "../controllers/store.js";
import item from "../controllers/item.js";
import auth from "../controllers/authentication.js";
import favourite from "../controllers/favourite.js";
import review from "../controllers/review.js";
import card from "../controllers/card.js";
import notification from "../controllers/notification.js";
import admin from "../controllers/admin.js";
import user from "../controllers/user.js";

const router = express.Router();

// Setup Orders for Customers

router.post("/order", authentication.verifyAuthToken, order.store);
router.get("/order/:id", authentication.verifyAuthToken, order.view);
router.get("/my-orders", authentication.verifyAuthToken, order.userOrders);
router.get("/recent-orders", authentication.verifyAuthToken, order.recentOrder);

router.get("/store-card", authentication.verifyAuthToken, card.store);

// ending orders for customers

// HomePage

router.post("/", authentication.verifyAuthToken, app.home);
// router.get('/store/:id',authentication.verifyAuthToken,store.getSingleStore);
router.post(
  "/store/:type",
  authentication.verifyAuthToken,
  store.singleStoreView
);
router.post("/store/web/:type", store.singleStoreView);

router.get("/store/halal-web", store.allHalalWeb);
router.get(
  "/store/:id/products",
  authentication.verifyAuthToken,
  store.getSingleStore
);

router.get(
  "/category/stores",
  authentication.verifyAuthToken,
  store.categoryWiseStores
);

router.get("/item/:id", item.view);
router.get("/item/:id/reviews", review.getSingleItemReviews);
router.post("/item/foryou", item.foryou);

// ending Home Page Setup

// Profile Section

router.put("/profile", authentication.verifyAuthToken, auth.profile);
router.delete("/delete", authentication.verifyAuthToken, auth.destroy);

// end profile section

// Favourit a store or items

router.post(
  "/favourite",
  authentication.verifyAuthToken,
  favourite.addToFavourite
);
router.get(
  "/favourite/:type",
  authentication.verifyAuthToken,
  favourite.getFavourites
);
router.get(
  "/favourite",
  authentication.verifyAuthToken,
  favourite.allFavourties
);

// End Favourit a store or items

// App Reviews

router.get(
  "/store/:id/reviews",
  authentication.verifyAuthToken,
  review.getStoreReviews
);
router.get(
  "/store/:id/reviewsByRating",
  authentication.verifyAuthToken,
  review.reviewsByRating
);

router.post("/reviews", authentication.verifyAuthToken, review.store);
// router.post('/reviews/:id',authentication.verifyAuthToken, review.getSingleReview);

// Advance Search Application

// recent search and popular searches

router.get(
  "/recent-search",
  authentication.verifyAuthToken,
  item.recentSearches
);
router.post(
  "/advance-search",
  authentication.verifyAuthToken,
  item.advanceSearch
);
router.get("/ingredients", admin.getIngredients);

//

// Ending Advance Search

// notification

router.get(
  "/notification",
  authentication.verifyAuthToken,
  notification.getNotificationForUser
);
router.post("/address", authentication.verifyAuthToken, user.address);

export default router;
