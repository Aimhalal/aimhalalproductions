import category from "../models/category.js";

// All Method Relatd to User Modal are defined here
const getCategoryById = async (id) => {
  try {
    let data = await category
      .findById({
        _id: id,
      })
      .lean();

    return data;
  } catch (error) {
    return error.message;
  }
};

export default {
  getCategoryById,
};
