import product from "../models/items.js";
import categoryModel from "../models/category.js";
import storeService from "../services/store.js";
import userService from "../services/user.js";
import promotionService from "../services/promotion.js";
import category from "../services/category.js";
import order from "../models/order.js";
import favourite from "../models/favourite.js";
import translate from "../utils/translate.js";

// All Method Relatd to User Modal are defined here
const getProductById = async (id, user = "") => {
  try {
    let data = await product
      .findById({
        _id: id,
      })
      .populate({
        path: "store",
      })
      .populate({
        path: "user",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      })
      .populate({
        path: "category",
      })
      .populate({
        path: "other",
      })

      .lean();

    // get promotion

    // let checkPromotions = await promotionService.getPromotionItems(id);
    // console.log('promotion check');

    data.isFavourite = false;

    // check if item is set to favourites
    if (user) {
      let checkFav = await favourite.findOne({
        item: id,
        user: user,
      });
      data.isFavourite = checkFav ? true : false;
    }

    return data;
  } catch (error) {
    return error.message;
  }
};

const fetchAllProducts = async (products) => {
  try {
    return await Promise.all(
      products.map(async (data) => {
        return await getProductById(data._id);
      })
    );
  } catch (error) {
    return error.message;
  }
};

const getBestSellingProducts = async (search = "", id) => {
  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setHours(0, 0, 0, 0 - currentDate.getDay() * 24 * 60 * 60 * 1000);

  const bestSellingProducts = await order.aggregate([
    {
      $match: { store: id },
    },

    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.item",
        totalQuantity: { $sum: "$items.qty" },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $limit: 10, // Adjust the limit as needed
    },
  ]);
  const bestSellingProductIds = bestSellingProducts.map(
    (product) => product._id
  );

  // Ensure uniqueness of product IDs
  const uniqueProductIds = [...new Set(bestSellingProductIds)];

  return uniqueProductIds;
};

// Admin  Services

const createUpdateCategory = async (category, id) => {
  try {
    let Category = await categoryModel.findOne({
      name: category,
    });
    if (Category) {
      // check if category is already in default stores

      let checkDefaultStore = await categoryModel.find({
        "default_stores.store": id,
      });

      if (!checkDefaultStore) {
        await categoryModel.findByIdAndUpdate(
          {
            _id: Category._id,
          },
          {
            $push: {
              default_stores: { store: id },
            },
          }
        );
      }
      Category = Category._id;

      // await categoryModel.findByIdAndUpdate({
      //     _id : Category._id
      // },{
      //     $push : {
      //         default_stores : {store : id}
      //     }
      // })

      // Category = Category._id
    } else {
      Category = new categoryModel({
        name: category,
        store: id,
        default_stores: { store: id },
      });
      Category = await Category.save();

      await translate.translateText(Category, "category");
    }

    return Category._id;
  } catch (error) {
    return "error";
  }
};

const createUpdateProduct = async (Product, id) => {
  try {
    let checkProduct = await product.findOne({
      item: Product.item,
      description: Product.description,
      store: id,
    });
    if (checkProduct) {
      await product.findByIdAndUpdate(
        {
          _id: checkProduct._id,
        },
        {
          $set: Product,
        },
        {
          new: true,
        }
      );
    } else {
      // no image

      Product.pictures = ["items/no-image.png"];

      checkProduct = new product(Product);
      checkProduct = await checkProduct.save();

      await translate.translateText(checkProduct, "product");
    }
    return checkProduct;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

// End Admin Services

export default {
  getProductById,
  fetchAllProducts,
  getBestSellingProducts,
  createUpdateCategory,
  createUpdateProduct,
};
