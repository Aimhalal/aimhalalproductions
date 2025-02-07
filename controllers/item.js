//  vendor routes

import item from "../models/items.js";
import productService from "../services/product.js";
import vendorService from "../services/role.js";
import Joi from "joi";
import helpers from "../utils/helpers.js";
import fs from "fs";
import search from "../models/search.js";
import category from "../models/category.js";
import Category from "../models/category.js";
import promotion from "../models/promotion.js";
import promotionService from "../services/promotion.js";
import { Readable } from "stream"; // Import the Readable class from the 'stream' module
import excel from "exceljs";
import translate from "../utils/translate.js";
import stores from "../models/stores.js";
import items from "../models/items.js";
import favourite from "../models/favourite.js";
import storeService from "../services/store.js";

// Vendor Product Section starting here

const getAll = async (req, res) => {
  try {
    let data = await helpers.paginate(
      item,
      { store: req.user.store._id },
      {},
      { item: 1 }
    );
    return res.json({
      status: 200,
      message: "success",
      data: data.data,
      pagination: data.pagination,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: [],
      pagination: [],
    });
  }
};

const all = async (req, res) => {
  let query = {};
  let { search } = req.query;
  try {
    // get store information

    query.store = req.user.store._id;
    if (search) query.item = new RegExp(search, "i");

    let data = await productService.getBestSellingProducts(
      search,
      req.user.store._id
    );
    data = await Promise.all(
      data.map(async (e) => {
        return await productService.getProductById(e._id);
      })
    );

    let categories = await category
      .find({
        "default_stores.store": req.user.store._id,
      })
      .lean();
    categories = await Promise.all(
      categories.map(async (e) => {
        e.products = await item.find({
          category: e._id,
          store: req.user.store._id,
        });
        return e;
      })
    );

    let allItems = await helpers.paginate(item, query);
    let results = allItems.data;
    let paginate = results.pagination;

    // results = await productService.fetchAllProducts(results)
    let menu = await stores
      .findById({ _id: req.user.store._id })
      .select("menu2");

    return res.json({
      status: 200,
      message: "success",
      data: {
        popularthisweek: data,
        categoryWise: categories,
        allProducts: results,
        menu: menu,
      },
      paginate: paginate,
    });
  } catch (error) {
    console.log(error);

    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

// Exports

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const bulkImport = async (req, res) => {
  let productInfo = {};
  let { _id } = req.user.store;

  try {
    if (!req.files) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const excelData = req.files.file.data;

    // Create a readable stream from the buffer
    const stream = new Readable();
    stream.push(excelData);
    stream.push(null); // End the stream

    const workbook = new excel.Workbook();

    await workbook.xlsx.read(stream);

    const worksheet = workbook.getWorksheet(1); // Assuming the data is in the first sheet
    if (!worksheet) {
      return res.json({
        status: 400,
        message: "issue with the Excel Sheet",
        data: {},
      });
    }
    const totalRows = worksheet.rowCount;

    let allCats = [];

    for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (row.getCell(1).value) {
        productInfo.item = row.getCell(1).value; // Get the value of cell B

        productInfo.item = capitalizeFirstLetter(productInfo.item);

        // productInfo.description = row.getCell(2).value; // Get the value of cell B

        // productInfo.description = capitalizeFirstLetter(productInfo.description)

        productInfo.category = row.getCell(2).value; // Get the value of cell C
        productInfo.other = row.getCell(3).value; // Get the value of cell C
        productInfo.price = row.getCell(4).value; // Get the value of cell C
        productInfo.description = productInfo.other;
        productInfo.discount = row.getCell(5).value; // Get the value of cell C

        productInfo.delivery_types = row.getCell(6).value; // Get the value of cell C

        // splite string to array based on  ,
        if (productInfo.category) {
          productInfo.category = productInfo.category.split(",");

          productInfo.category = await Promise.all(
            productInfo.category.map(async (e) => {
              return await productService.createUpdateCategory(e, _id);
            })
          );
        }

        if (productInfo.delivery_types) {
          productInfo.delivery_types = productInfo.delivery_types.split(",");
        }

        //  handle categories

        // handle Other Category
        if (productInfo.other) {
          // Split the string by comma to handle multiple values
          // const otherValues = productInfo.other.split(',');

          productInfo.tags = productInfo.other;

          // // Initializep productInfo.category as an empty array if it's null
          // if (!productInfo.category) {
          //     productInfo.category = [];
          // }

          // // Loop through each value
          // for (const value of otherValues) {
          //     // Create or update category for each value
          //     let otherCategory = await productService.createUpdateCategory(value.trim(), _id);

          //     // Push the category to the productInfo.category array
          //     productInfo.category.push(otherCategory);
          // }

          // // Update productInfo.other to contain the last created/updated category
          // productInfo.other = productInfo.category[productInfo.category.length - 1];
        }

        delete productInfo.IncPrice;
        delete productInfo.incredients;
        delete productInfo.other;

        // add user and store information

        productInfo.store = _id;
        productInfo.user = req.user._id;

        // Check discounts

        if (productInfo.discount) {
          // calculate discounted price first

          let discounted_price =
            productInfo.price -
            productInfo.price * (productInfo.discount / 100);

          productInfo.discounted_price = discounted_price;
          let discountPercentage =
            productInfo.price * (productInfo.discount / 100);
          productInfo.discount_percentage = discountPercentage;

          productInfo.discounted_price =
            productInfo.discounted_price.toFixed(2);

          productInfo.discount = productInfo.discount;

          productInfo.discount_percentage =
            productInfo.discount_percentage.toFixed(2);
        }

        console.log(productInfo);

        //  Add and update product
        await productService.createUpdateProduct(productInfo, _id);
      }
    }

    // Handle the response when all rows are processed
    res.json({
      status: 200,
      message: "Data processing completed",
      data: [],
    });
  } catch (error) {
    console.log(error);
    // console.error('fError reading Excel ile:', error);
    res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

const bulkExport = async (req, res) => {
  try {
    const data = await YourModel.find(); // Fetch data from MongoDB
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");
    const headers = Object.keys(data[0]); // Assuming data is an array of objects
    worksheet.addRow(headers);
    data.forEach((item) => {
      const row = [];
      headers.forEach((header) => {
        row.push(item[header]);
      });
      worksheet.addRow(row);
    });
    const filePath = "output.xlsx";
    await workbook.xlsx.writeFile(filePath);

    return res.json({
      status: 200,
      message: "success",
      data: [],
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

// Endig Exports

const uploadDigitalMenu = async (req, res) => {
  try {
    if (req.files) {
      let pictures = [];
      const dirOne = "public/items";
      const pictureFiles = Array.isArray(req.files.pictures)
        ? req.files.pictures
        : [req.files.pictures];

      const picturePromises = pictureFiles.map((pic) => {
        return new Promise((resolve, reject) => {
          let imageName = `${Date.now()}_${pic.name}`;
          let imageNameOne = `${dirOne}/` + imageName;

          if (!fs.existsSync(dirOne)) {
            fs.mkdirSync(dirOne, { recursive: true });
          }

          pic.mv(imageNameOne, (error) => {
            if (error) {
              reject(error);
            } else {
              pictures.push({ picture: `items/${imageName}` });
              resolve();
            }
          });
        });
      });

      await Promise.all(picturePromises);

      // Push new pictures to the existing menu array
      await stores.findByIdAndUpdate(req.user.store._id, {
        $push: { menu2: pictures },
      });
      console.log("store");
    } else {
      return res.json({
        status: 500,
        message: "Pictures are required",
        data: {},
      });
    }

    return res.json({
      status: 200,
      message: "Success",
      data: {},
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const editDigitalMenu = async (req, res) => {
  let { id } = req.params;
  try {
    let newData = await stores.findByIdAndUpdate(req.user.store._id, {
      $pull: { menu2: { _id: id } },
    });
    return res.json({
      status: 200,
      message: "success",
      data: newData,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.messsage,
      data: {},
    });
  }
};

const store = async (req, res) => {
  try {
    // validate records first
    let category = [];
    const itemSchema = Joi.object({
      item: Joi.string().required(),
      category: Joi.string(),
      other: Joi.any(),
      price: Joi.number().required(),
      delivery_types: Joi.string().required(),
      discounted_price: Joi.string(),
      discount_percentage: Joi.number(),
      incredients: Joi.string(),
      discount: Joi.number(),
      description: Joi.string(),
    });

    const { error } = itemSchema.validate(req.body);
    if (error)
      return res
        .status(200)
        .json({ status: 400, message: error.message, data: {} });

    // get user information from the token

    req.body.store = req.user.store;
    req.body.user = req.user._id;

    if (req.body.category) {
      category = JSON.parse(req.body.category);
    }

    if (req.body.other) {
      req.body.tags = req.body.other;
    }

    if (req.body.delivery_types) {
      req.body.delivery_types = req.body.delivery_types.split(",");
    }

    req.body.category = category;
    // get store information
    req.body.incredients = JSON.parse(req.body.incredients, true);

    // uploading images if available

    if (req.files) {
      let pictures = []; // Declare pictures array within the if block

      const dirOne = "public/items";
      const pictureFiles = Array.isArray(req.files.pictures)
        ? req.files.pictures
        : [req.files.pictures];

      const picturePromises = pictureFiles.map((pic) => {
        return new Promise((resolve, reject) => {
          let imageName = `${Date.now()}_${pic.name}`;

          let imageNameOne = `${dirOne}/` + imageName;

          if (!fs.existsSync(dirOne)) {
            fs.mkdirSync(dirOne, { recursive: true });
          }

          pic.mv(imageNameOne, (error) => {
            if (error) {
              reject(error);
            } else {
              pictures.push(`items/${imageName}`);
              resolve();
            }
          });
        });
      });

      // Wait for all file uploads to complete
      await Promise.all(picturePromises);

      // Upload Images to the pictures object as a flat array
      req.body.pictures = pictures.flat();
    } else {
      req.body.pictures = ["store/no-image.png"];
    }

    // upload Images to the pictures object
    // req.body.pictures = pictures;

    delete req.body.other;

    let data = new item(req.body);
    data = await data.save();

    // product information

    let response = await translate.translateText(data);

    // get store information from the helper

    data = await productService.getProductById(data._id);

    return res.json({
      status: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const update = async (req, res) => {
  let { id } = req.params;
  let category = [];
  try {
    // check if item  exists

    let checkItem = await item.findById({
      _id: id,
    });
    if (!checkItem)
      return res.json({
        status: 404,
        message: "product not found",
        data: {},
      });

    if (req.body.category) {
      category = JSON.parse(req.body.category);
      req.body.category = category;
    }

    if (req.body.other) {
      req.body.tags = req.body.other;
    }
    delete req.body.other;

    // get store information
    if (req.body.incredients) {
      req.body.incredients = JSON.parse(req.body.incredients, true);
    }

    // uploading images if available

    if (req.files) {
      let pictures = []; // Declare pictures array within the if block

      const dirOne = "public/items";
      const pictureFiles = Array.isArray(req.files.pictures)
        ? req.files.pictures
        : [req.files.pictures];

      const picturePromises = pictureFiles.map((pic) => {
        return new Promise((resolve, reject) => {
          let imageName = `${Date.now()}_${pic.name}`;
          let imageNameOne = `${dirOne}/` + imageName;

          if (!fs.existsSync(dirOne)) {
            fs.mkdirSync(dirOne, { recursive: true });
          }

          pic.mv(imageNameOne, (error) => {
            if (error) {
              reject(error);
            } else {
              pictures.push(`items/${imageName}`);
              console.log(pictures);
              resolve();
            }
          });
        });
      });

      // Wait for all file uploads to complete
      await Promise.all(picturePromises);

      // Upload Images to the pictures object as a flat array
      req.body.pictures = pictures.flat();
    }

    // upload Images to the pictures object
    // req.body.pictures = pictures;

    let data = await item.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    //

    // get store information from the helper

    data = await productService.getProductById(data._id);

    return res.json({
      status: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const view = async (req, res) => {
  let { id } = req.params;

  try {
    let data = await item.findById({ _id: id });
    if (!data)
      return res.json({ status: 404, message: "product not found", data });

    data = await productService.getProductById(id);
    return res.json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const destroy = async (req, res) => {
  let { id } = req.params;
  try {
    // Delete promotions
    await promotion.findOneAndDelete({
      item: id,
    });
    //
    await favourite.findOneAndDelete({
      item: id,
    });

    let data = await items.findByIdAndDelete({
      _id: id,
    });

    return res.json({
      status: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const itembyCategoryId = async (req, res) => {
  let { id } = req.params;
  let query = {};
  try {
    query.category = id;
    let data = await helpers.paginate(item, query);
    console.log(data);
    let paginate = data.pagination;
    data = await productService.fetchAllProducts(data.data);

    return res.json({
      status: 200,
      message: "success",
      data: data,
      paginate,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

// vendor product Section ending here

// App Store Products

const getProductsBystoreId = async (req, res) => {
  let query = {};
  try {
    query.store = req.params.id;

    let data = await helpers.paginate(item, query);
    let pagination = data.pagination;

    // Best ratted Product

    // Best Sold Product

    // categorywise Product

    data = await productService.fetchAllProducts(data.data);

    return res.json({
      status: 200,
      message: "success",
      data: {
        foryou: { foryou: [], popular: [] },
        categoryWiseData: [{ asprin: data }],
      },
      pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// endign App Store Products

// App Cart For you products

const foryou = async (req, res) => {
  let { categories } = req.body;
  let query = {
    category: { $in: categories },
  };
  try {
    let data = await helpers.paginate(item, query, [
      {
        path: "store",
      },
      {
        path: "user",
        select: {
          username: 1,
          email: 1,
          number: 1,
          address: 1,
        },
      },
      {
        path: "category",
      },
      {
        path: "other",
      },
    ]);

    return res.json({
      status: 200,
      message: "success",
      data: data.data,
      pagination: data.pagination,
    });
  } catch (error) {
    return res.json({
      status: 200,
      message: error.message,
      data: [],
    });
  }
};

//

// App Searchable products

const recentSearches = async (req, res) => {
  let { _id } = req.user;
  let recent = [];
  let popular = [];
  try {
    recent = await search.find({ user: _id }).select({ keyword: 1 }).limit(6);
    popular = [];

    return res.json({
      status: 200,
      message: "success",
      data: { recent, popular },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

const advanceSearch = async (req, res) => {
  let { keyword, sort, longitude, latitude } = req.body;
  let itemDaa = [];
  let promotionData = [];
  let store = [];
  let relatedCategory = [];
  let Stores = [];

  try {
    // store search results in search table, to show recent searches

    const regex = new RegExp(keyword, "i"); // Creating a case-insensitive regular expression that matches any substring containing the keyword

    let query = { item: { $regex: regex } };
    let data = [];
    if (keyword) {
      data = await helpers.paginate(item, query);
    }

    const regexStore = new RegExp(keyword, "i"); // Creating a case-insensitive regular expression that matches any substring containing the keyword

    let queryStore = {
      store_name: { $regex: regexStore },
      isAvailable: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $minDistance: 0,
          $maxDistance: 5000,
        },
      },
    };

    // Stores

    Stores = await storeService.nearByStores(queryStore);

    Stores = await Promise.all(
      Stores.map(async (e) => {
        return await storeService.getStoreById(e._id);
      })
    );

    let result = [];

    if (keyword) {
      result = await Promise.all(
        data.data.map(async (e) => {
          relatedCategory.push(e.category);

          e = await productService.getProductById(e._id, req.user._id);
          e.store = e.store._id;
          return e;
        })
      );
    }

    //

    let promotions = await promotionService.nearByPromotions({ type: "item" });

    // add keywords for products
    let relatedProducts = await item.find({
      category: { $in: relatedCategory },
    });
    await Promise.all(
      relatedProducts.map(async (e) => {
        itemDaa.push(e.item);
      })
    );

    return res.json({
      status: 200,
      message: "success",
      data: {
        suggestions: itemDaa,
        products: result,
        promotion: promotions,
        stores: Stores,
      },
      pagination: data.pagination,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

// Ending App Searchable Products

export default {
  // Exports for Vendor
  bulkImport,
  bulkExport,

  // Ending Exports

  store,
  view,
  update,
  getAll,
  uploadDigitalMenu,
  editDigitalMenu,
  destroy,

  // vendor products

  all,
  itembyCategoryId,
  getProductsBystoreId,

  // App items for you

  foryou,
  recentSearches,
  advanceSearch,

  // Ending app items
};
