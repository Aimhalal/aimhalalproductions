import { IngredientList } from "../models/ingredientList.js";
import { PassThrough } from "stream";
import csv from "csv-parser";
import axios from "axios";

const createIngredientListEntry = async (data, _) => {
  const filteredData = {};
  for (const key in data) {
    const lowerCaseKey = key.toLowerCase();
    const lowerCaseValue = data[key].toString().toLowerCase(); // Convert value to string and lowercase
    if (lowerCaseValue !== "") {
      filteredData[lowerCaseKey] = lowerCaseValue;
    }
  }

  const ingredientListData = {
    ...filteredData,
  };

  const ingredientList = new IngredientList(ingredientListData);
  return await ingredientList.save();
  // return ingredientListData
};

const updateIngredientList = async (req, res) => {
  try {
    console.log("here");
    if (!req.files) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // console.log(req.files.files.data)
    const results = [];

    const bufferStream = new PassThrough();
    bufferStream.end(req.files?.files?.data);

    bufferStream
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", async () => {
        try {
          const createdIngredientList = [];
          for (const result of results) {
            const ingredient = await createIngredientListEntry(result, {});
            createdIngredientList.push(ingredient);
          }

          return res
            .status(200)
            .json({
              status: 200,
              data: createdIngredientList,
              message:
                "CSV file processed and Ingredient List added successfully.",
            });
        } catch (error) {
          return res
            .status(500)
            .json({ message: "Error creating Ingredient entries", error });
        }
      })
      .on("error", (error) => {
        return res.status(500).json({ message: `Error parsing CSV ${error}` });
      });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const getIngredientList = async (req, res) => {
  try {
    const ingredients = await IngredientList.find();
    return res.status(200).json(ingredients);
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

// const multipleIngredientList = async (req, res) => {
//     try {
//         let { list } = req.body;
//         console.log(req.body);

//         if (!list) {
//             return res.status(400).json({ message: "Expected List Not Found" });
//         }

//         let haramItems = [];
//         let mushboohItems = [];
//         // let halalItems = [];
//         for (let i = 0; i < list.length; i++) {
//             let searchString = list[i];

//             // Escape special characters in the search string
//             searchString = searchString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

//             console.log(searchString, " list");
//             const current = await IngredientList.findOne({
//                 name: {
//                     $regex: searchString,
//                     $options: 'i'
//                 }
//             });
//             console.log(current);

//             if (current?.type.toLowerCase() === "haram") {
//                 haramItems.push(current.name);
//             }
//             if (current?.type.toLowerCase() === "mushbooh") {
//                 mushboohItems.push(current.name);
//             }
//             // if (current?.type.toLowerCase() === "halal") {
//             //     halalItems.push(current.name);
//             // }
//         }

//         if (haramItems.length > 0) {
//             return res.status(200).json({
//                 success: true,
//                 type: "HARAM",
//                 materials: haramItems,
//                 message: "Data Sent Successfully"
//             });
//         }

//         if (mushboohItems.length > 0) {
//             return res.status(200).json({
//                 success: true,
//                 type: "MUSHBOOH",
//                 materials: mushboohItems,
//                 message: "Data Sent Successfully"
//             });
//         }
//         // if (halalItems.length > 0) {
//         //     return res.status(200).json({
//         //         success: true,
//         //         type: "Halal",
//         //         materials: halalItems,
//         //         message: "Data Sent Successfully"
//         //     });
//         // }

//         return res.status(200).json({
//             success: true,
//             type: "Halal",
//             materials: list,
//             message: "Data Sent Successfully"
//         });

//     } catch (error) {
//         return res.json({
//             status: 500,
//             message: error.message,
//             data: {}
//         });
//     }
// };

// const multipleIngredientList = async (req, res) => {
//     try {
//         let { list } = req.body;

//         if (!list) {
//             return res.status(400).json({ message: "Expected List Not Found here..." });
//         }

//         let haramItems = [];
//         let mushboohItems = [];
//         // let halalItems = [];

//         for (let i = 0; i < list.length; i++) {
//             let searchString = list[i].toLowerCase().trim();

//             console.log(searchString, " list");

//             // Find all ingredients that could match
//             const possibleMatches = await IngredientList.find({
//                 name: {
//                     $regex: searchString.split(/\s+/).join("|"),
//                     $options: 'i'
//                 }
//             });

//             let exactMatch = possibleMatches.find(ingredient =>
//                 searchString.includes(ingredient.name.toLowerCase())
//             );

//             if (exactMatch?.type.toLowerCase() === "haram") {
//                 haramItems.push(exactMatch.name);
//             }
//             if (exactMatch?.type.toLowerCase() === "mushbooh") {
//                 mushboohItems.push(exactMatch.name);
//             }
//             // if (exactMatch?.type.toLowerCase() === "halal") {
//             //     halalItems.push(exactMatch.name);
//             // }
//         }

//         if (haramItems.length > 0) {
//             return res.status(200).json({
//                 success: true,
//                 type: "HARAM",
//                 materials: haramItems,
//                 message: "Data Sent Successfully"
//             });
//         }

//         if (mushboohItems.length > 0) {
//             return res.status(200).json({
//                 success: true,
//                 type: "MUSHBOOH",
//                 materials: mushboohItems,
//                 message: "Data Sent Successfully"
//             });
//         }
//         // if (halalItems.length > 0) {
//         //     return res.status(200).json({
//         //         success: true,
//         //         type: "Halal",
//         //         materials: halalItems,
//         //         message: "Data Sent Successfully"
//         //     });
//         // }

//         return res.status(200).json({
//             success: true,
//             type: "Halal",
//             materials: list,
//             message: "Data Sent Successfully"
//         });

//     } catch (error) {
//         return res.json({
//             status: 500,
//             message: error.message,
//             data: {}
//         });
//     }
// };

const multipleIngredientList = async (req, res) => {
  try {
    let data = req.body;

    if (!data.list && !data.barcode) {
      return res
        .status(400)
        .json({ message: "Expected List Not Found here..." });
    }

    let haramItems = [];
    let mushboohItems = [];
    // let halalItems = [];
    if (data?.list) {
      for (let i = 0; i < data?.list.length; i++) {
        let searchString = data?.list[i].toLowerCase().trim();

        console.log(searchString, " list");

        // Find all ingredients that could match
        const possibleMatches = await IngredientList.find({
          name: {
            $regex: searchString.split(/\s+/).join("|"),
            $options: "i",
          },
        });

        let exactMatch = possibleMatches.find((ingredient) =>
          searchString.includes(ingredient.name.toLowerCase())
        );

        if (exactMatch?.type.toLowerCase() === "haram") {
          haramItems.push(exactMatch.name);
        }
        if (exactMatch?.type.toLowerCase() === "mushbooh") {
          mushboohItems.push(exactMatch.name);
        }
        // if (exactMatch?.type.toLowerCase() === "halal") {
        //     halalItems.push(exactMatch.name);
        // }
      }

      if (haramItems.length > 0) {
        return res.status(200).json({
          success: true,
          type: "HARAM",
          ingredients: haramItems,
          message: "Data Sent Successfully",
        });
      }

      if (mushboohItems.length > 0) {
        return res.status(200).json({
          success: true,
          type: "MUSHBOOH",
          ingredients: mushboohItems,
          message: "Data Sent Successfully",
        });
      }
      // if (halalItems.length > 0) {
      //     return res.status(200).json({
      //         success: true,
      //         type: "Halal",
      //         materials: halalItems,
      //         message: "Data Sent Successfully"
      //     });
      // }

      return res.status(200).json({
        success: true,
        type: "Halal",
        ingredients: data.list,
        message: "Data Sent Successfully",
      });
    }

    if (data?.barcode) {
      const response = await axios.get(
        `https://vegornot.azurewebsites.net/api/HttpTrigger1?upc=${data.barcode}`
      );
      if (!response) {
        return res.status(500).json({
          status: 500,
          message: "Error While Fetching Data",
          data: {},
        });
      }

      if (response.data.response.toString().includes("N/A")) {
        return res.status(200).json({
          success: true,
          type: null,
          ingredients: null,
          message: "Data Sent Successfully",
        });
      }

      return res.status(200).json({
        success: true,
        type: response.data.response.split("\n")[0].trim().split(" ")[0],
        ingredients: response.data.ingredients,
        message: "Data Sent Successfully",
      });
    }
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: {},
    });
  }
};

const delIngredients = async (req, res) => {
  const itDel = await IngredientList.deleteMany({});
  return res.status(200).json({ message: "deleted" });
};

export {
  updateIngredientList,
  getIngredientList,
  multipleIngredientList,
  delIngredients,
};
