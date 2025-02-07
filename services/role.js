import role from "../models/roles.js";
import storeCategory from "../models/storeCategory.js";

// All Method Relatd to User Modal are defined here
const getRoleById = async (id) => {
  try {
    let data = await role.findById(id);
    return data;
  } catch (error) {
    return error.message;
  }
};

const getRoleByName = async (name) => {
  try {
    let data = await role.findOne({
      name: name,
    });
    return data;
  } catch (error) {
    return error.message;
  }
};

const getVendorTypes = async () => {
  try {
    // Fetch the document with the role 'vendor'
    let data = await role.findOne({ name: "vendor" }).lean();

    if (data && data.types) {
      // Sort the types array by series in ascending order
      data.types.sort((a, b) => a.series - b.series);
    } else {
      return null; // Handle the case where no document with the name "vendor" is found
    }

    // Add new vendor types to the array
    data.types.push(
      {
        name: "Quran Learning",
        image: "category/Quran.png",
        series: 3,
      },
      {
        name: "Halal Web",
        image: "category/HalalWeb.png",
        series: 4,
      },
      {
        name: "Prayer Times",
        image: "category/prayers_time_.png",
        series: 2,
      },
      {
        name: "Home Chef",
        image: "category/hotdog.png",
        series: 5,
      }
    );

    // Sort the array again after adding new items
    data.types.sort((a, b) => a.series - b.series);

    // Filter out the item with series 20
    data.types = data.types.filter((item) => item.series != 20);

    return data.types; // Return the updated types array
  } catch (error) {
    return error.message; // Return error message in case of failure
  }
};

const checkHalalWebCategory = async (types) => {
  try {
    let findCategory = await storeCategory.findOne({ name: types });
    return findCategory;
  } catch (error) {
    return error.message;
  }
};

export default {
  getRoleById,
  getVendorTypes,
  getRoleByName,
  checkHalalWebCategory,
};
