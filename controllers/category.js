//  vendor routes
import category from "../models/category.js";
import Category from "../models/category.js";
import helpers from "../utils/helpers.js";
import fs from "fs";
import translate from "../utils/translate.js";
import mongoose from "mongoose";
import storeCategory from "../models/storeCategory.js";
import stores from "../models/stores.js";
import items from "../models/items.js";

const store = async (req, res) => {
  try {
    let checkCategory = await Category.findOne({
      name: req.body.name,
    });

    if (checkCategory) {
      // check if store is already added to this category

      let checkDefaultStore = await Category.find({
        name: req.body.name,
        "default_stores.store": req.user.store._id,
      });

      if (!checkDefaultStore.length) {
        await Category.findByIdAndUpdate(
          {
            _id: checkCategory._id,
          },
          {
            $push: {
              default_stores: { store: req.user.store._id },
            },
          }
        );
      }
    } else {
      if (req.files) {
        let picture = req.files.picture;
        const dirOne = "public/category";
        let imageNameOne;
        if (picture) {
          let imageName = `${Date.now()}_${picture.name}`;
          imageNameOne = `${dirOne}/` + imageName;
          if (!fs.existsSync(dirOne)) {
            fs.mkdirSync(dirOne, { recursive: true });
          }
          picture.mv(imageNameOne, (error) => {
            if (error) {
              return res.status(200).json({
                status: 400,
                error: error.message,
                data: "",
              });
            }
          });

          req.body.picture = `category/${imageName}`;
        }
      }

      req.body.default_stores = {
        store: req.user.store._id,
      };

      let category = new Category(req.body);
      category = await category.save();

      // Add translation for categories

      await translate.translateText(category, "category");
    }

    return res.json({
      status: 200,
      message: "success",
      data: checkCategory,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const index = async (req, res) => {
  let { store_id } = req.query;
  try {
    let data;

    if (store_id) {
      data = await helpers.paginate(Category, {
        "default_stores.store": mongoose.Types.ObjectId(store_id),
      });
    } else {
      data = [];
    }

    return res.json({
      status: 200,
      message: "success",
      data: data.data,
      pagination: data?.pagination,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
      pagination: {},
    });
  }
};

const update = async (req, res) => {
  let { id } = req.params;
  try {
    if (req.files) {
      let picture = req.files.picture;
      const dirOne = "public/category";
      let imageNameOne;
      if (picture) {
        let imageName = `${Date.now()}_${picture.name}`;
        imageNameOne = `${dirOne}/` + imageName;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        picture.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              error: error.message,
              data: "",
            });
          }
        });

        req.body.picture = `category/${imageName}`;
      }
    }

    let data = await category.findByIdAndUpdate(
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

const deleteCategory = async (req, res) => {
  try {
    await category.findByIdAndDelete({
      _id: req.params.id,
    });
    return res.json({
      status: 200,
      message: "success",
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

const deleteStoreCategory = async (req, res) => {
  try {
    // check if category has Stores connected to it

    let checkCategory = await storeCategory.findById({
      _id: req.params.id,
    });

    if (!checkCategory) {
      return res.json({
        status: 404,
        message: "category not found",
        data: {},
      });
    }

    let findStores = await stores.find({
      types: checkCategory.name,
    });
    if (findStores.length) {
      return res.json({
        status: 500,
        message: "Category can't be deleted, as the category contains stores",
        data: findStores,
      });
    }

    let storeCa = await storeCategory.findByIdAndDelete({
      _id: mongoose.Types.ObjectId(req.params.id),
    });

    return res.json({
      status: 200,
      message: "success",
      data: storeCa,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const editStoreCategory = async (req, res) => {
  let { id } = req.params;
  try {
    let checkCategory = await storeCategory.findById({
      _id: id,
    });
    if (!checkCategory) {
      return res.json({
        status: 404,
        message: "Category not found",
        data: {},
      });
    }
    // ssa

    if (req.files) {
      let picture = req.files.picture;
      const dirOne = "public/category";
      let imageNameOne;
      if (picture) {
        let imageName = `${Date.now()}_${picture.name}`;
        imageNameOne = `${dirOne}/` + imageName;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        picture.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              message: error.message,
              data: "",
            });
          }
        });

        req.body.picture = `category/${imageName}`;
      }
    } else {
      return res.status(200).json({
        status: 400,
        message: "no image",
        data: req.files,
      });
    }

    let data = await storeCategory.findByIdAndUpdate(
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

const addStoreCategory = async (req, res) => {
  try {
    let checkCategory = await storeCategory.findOne({
      name: req.body.name,
    });

    if (checkCategory) {
      return res.json({
        status: 409,
        message: "already available",
        data: checkCategory,
      });
    }

    if (req.files) {
      let picture = req.files.picture;

      picture.name = picture.name.replace(/\s+/g, "_"); // Replace all whitespace characters with underscores

      const mobile_logo = req.files.picture.data;
      let mobile_logoResponse = await helpers.storeImageWithValidation(
        mobile_logo
      );

      if (
        picture &&
        (mobile_logoResponse.width !== 120 ||
          mobile_logoResponse.height !== 120)
      ) {
        return res.status(200).json({
          status: 400,
          message:
            "Invalid Category dimensions. Logo size should be exactly 120X120 pixels.",
          data: "",
        });
      }

      const dirOne = "public/category";
      let imageNameOne;
      if (picture) {
        let imageName = `${Date.now()}_${picture.name}`;
        imageNameOne = `${dirOne}/` + imageName;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        picture.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              error: error.message,
              data: "",
            });
          }
        });

        req.body.picture = `category/${imageName}`;
      }
    }

    req.body.parent = mongoose.Types.ObjectId("65dddfe4ba71d2b3a51d3bad");
    req.body.group = "Halal Web";

    let data = new storeCategory(req.body);
    data = await data.save();

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

const listStoreCategory = async (req, res) => {
  try {
    let data = await storeCategory
      .find({
        parent: null,
      })
      .lean();
    data = await Promise.all(
      data.map(async (e) => {
        e.childs = await storeCategory
          .find({ parent: e._id })
          .select({ name: 1 });
        return e;
      })
    );
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

const categorywithStoresCount = async (req, res) => {
  try {
    let data = await storeCategory
      .find({
        name: {
          $ne: "Halal Web",
        },
      })
      .lean();
    data = await Promise.all(
      data.map(async (e) => {
        e.stores = await stores
          .find({
            types: e.name,
          })
          .count();
        return e;
      })
    );
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

const updateStoreCategory = async (req, res) => {
  let { id } = req.params;
  try {
    let checkCategory = await storeCategory.findOne({
      _id: id,
    });
    if (checkCategory) {
      checkCategory = await storeCategory.findByIdAndUpdate(
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
    }

    return res.json({
      status: 200,
      message: "success",
      data: checkCategory,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// Vendor Category Section

const deleteProductCategory = async (req, res) => {
  let { id, categoryId } = req.params;
  try {
    let checkProduct = await items.findOneAndUpdate(
      {
        _id: id,
        category: {
          $in: [categoryId], // Wrap categoryId in an array
        },
      },
      {
        $pull: { category: categoryId },
      },
      { new: true }
    );

    if (!checkProduct) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
        data: {},
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Category removed successfully",
      data: checkProduct,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const deleteCategoryFromStore = async (req, res) => {
  let { id } = req.params;
  let { store } = req.user; // Assuming req.user contains the current user's information including the store

  try {
    let checkCategory = await category.findOneAndUpdate(
      {
        _id: id,
        "default_stores.store": store._id, // Find the category with the specified ID and the matching store ID
      },
      {
        $pull: { default_stores: { store: store._id } }, // Remove the store from the default_stores array
      },
      { new: true }
    );

    // Remove category from all these products

    // Step 2: Update all products associated with the store to remove the category
    await items.updateMany(
      { store: store._id, category: id }, // Find all products of the store with the given category
      { $pull: { category: id } } // Remove the category from the category array of each product
    );

    // If checkCategory is null or default_stores is empty, remove the category entirely
    if (!checkCategory || checkCategory.default_stores.length === 0) {
      await category.findOneAndDelete({ _id: id });

      return res.status(200).json({
        status: 200,
        message: "Category removed successfully",
        data: {},
      });
    }

    if (!checkCategory) {
      return res.status(404).json({
        status: 404,
        message: "Store Or Category not found",
        data: {},
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Category removed from store successfully",
      data: checkCategory,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Ending Vendor Category Section

export default {
  store,
  index,
  update,
  deleteCategory,
  updateStoreCategory,
  categorywithStoresCount,

  // Store

  addStoreCategory,
  listStoreCategory,
  deleteStoreCategory,
  editStoreCategory,

  // Vendor Category

  deleteProductCategory,
  deleteCategoryFromStore,

  // Vendor Category
};
