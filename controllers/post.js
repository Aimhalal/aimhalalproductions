import Post from "../models/post.js";
import helpers from "../utils/helpers.js";
import fs from "fs";
import axios from "axios";
import post from "../models/post.js";

const store = async (req, res) => {
  try {
    // add user data into i
    req.body.user = req.user._id;

    if (req.files) {
      let picture = req.files.picture;
      let cover = req.files.cover;
      const dirOne = "public/posts";
      let imageNameOne;
      if (picture) {
        const bannerBuffer = req.files.picture.data;

        let mobile_bannerBufferResponse =
          await helpers.storeImageWithValidation(bannerBuffer);
        console.log(mobile_bannerBufferResponse);
        if (
          picture &&
          (mobile_bannerBufferResponse.width !== 450 ||
            mobile_bannerBufferResponse.height !== 350)
        ) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid banner dimensions for Picture. Banner size should be exactly 450x350 pixels.",
            data: "",
          });
        }

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

        req.body.picture = `posts/${imageName}`;
      }
      if (cover) {
        const coverBuffer = req.files.cover.data;

        let coverBufferResponse = await helpers.storeImageWithValidation(
          coverBuffer
        );

        if (
          cover &&
          (coverBufferResponse.width !== 1400 ||
            coverBufferResponse.height !== 500)
        ) {
          return res.status(200).json({
            status: 400,
            message:
              "Invalid banner dimensions for Cover. Banner size should be exactly 1400x500 pixels.",
            data: "",
          });
        }

        let imageName = `${Date.now()}_${cover.name}`;
        imageNameOne = `${dirOne}/` + imageName;
        if (!fs.existsSync(dirOne)) {
          fs.mkdirSync(dirOne, { recursive: true });
        }
        cover.mv(imageNameOne, (error) => {
          if (error) {
            return res.status(200).json({
              status: 400,
              error: error.message,
              data: "",
            });
          }
        });

        req.body.cover = `posts/${imageName}`;
      }
    } else {
      return res.status(200).json({
        status: 400,
        message: "Images are Required",
        data: "",
      });
    }

    // Get Coordiantes from Google Map Api
    let newLocation = req.body.fullAddress
      ? req.body.fullAddress
      : req.body.location;

    if (newLocation) {
      req.body.post_type = "event";
      if (req.body.location || req.body.fullAddress) {
        console.log(newLocation);

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          newLocation
        )}&key=${process.env.Map_API}`;
        const response = await axios.get(url);
        if (response.data.status !== "OK") {
          return res.json({
            status: 500,
            message: `Invalid Address ${req.body.location}`,
            data: {},
          });
        }
        const location = response.data.results[0].geometry.location;

        req.body.latitude = location.lat;
        req.body.longitude = location.lng;
      }
    } else {
      req.body.post_type = "blog";
    }

    if (req.body.contactNumber) {
      // Assuming req.body.number contains the number to remove
      let newStr = req.body.contactNumber.replace(/\+/g, ""); // Using a regular expression with the global flag to remove all occurrences of '+'
      req.body.contactNumber = newStr;
    }

    if (req.body.currentDate) {
      req.body.date = req.body.currentDate;
    }

    if (req.body.time == "00:00") {
      req.body.time = "12:00";
    }
    if (req.body.endtime == "00:00") {
      req.body.endtime = "12:00";
    }

    let post = new Post(req.body);
    post = await post.save();

    return res.json({
      status: 200,
      message: "success",
      data: post,
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
  let { type } = req.query;
  const currentDate = new Date();
  let query = {};
  let pastQuery = {};

  try {
    if (type == "event") {
      query.post_type = type;
      query.isArchive = false;
      query.endDate = { $gt: currentDate };
      pastQuery.post_type = type;
      pastQuery.endDate = { $lt: currentDate };
    } else {
      query.post_type = "blog";
      query.isArchive = false;
    }

    // Assuming helpers.paginate function accepts query object as the second parameter

    let pastData = await helpers.paginate(
      Post,
      pastQuery,
      [],
      {},
      1,
      100,
      "date",
      "asc"
    );
    let upcomingData = await helpers.paginate(
      Post,
      query,
      [],
      {},
      1,
      100,
      "date",
      "asc"
    );
    let blogs = await helpers.paginate(
      Post,
      {},
      [],
      {},
      1,
      100,
      "date",
      "desc"
    );

    return res.json({
      status: 200,
      message: "success",
      data: {
        past: pastData.data,
        upcoming: upcomingData.data,
        blogs: blogs.data,
      },
      pagination: {
        past: pastData.pagination,
        upcoming: upcomingData.pagination,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

const adminPosts = async (req, res) => {
  let { type } = req.query;
  const currentDate = new Date();
  let query = {};
  let pastQuery = {};

  try {
    if (type == "event") {
      query.post_type = type;
      query.endDate = { $gt: currentDate };
      query.isArchive = false;

      pastQuery.post_type = type;
      pastQuery.endDate = { $lt: currentDate };
      pastQuery.isArchive = false;
    } else {
      query.post_type = "blog";
    }

    // Assuming helpers.paginate function accepts query object as the second parameter

    let pastData = await helpers.paginate(
      Post,
      pastQuery,
      [],
      {},
      1,
      100,
      "date",
      "desc"
    );
    let upcomingData = await helpers.paginate(
      Post,
      query,
      [],
      {},
      1,
      100,
      "date",
      "desc"
    );
    let blogs = await helpers.paginate(
      Post,
      { post_type: "blog" },
      [],
      {},
      1,
      100,
      "date",
      "desc"
    );
    let archivedEvents = await helpers.paginate(
      Post,
      { post_type: "event", isArchive: true },
      [],
      {},
      1,
      100,
      "date",
      "desc"
    );

    return res.json({
      status: 200,
      message: "success",
      data: {
        past: pastData.data,
        upcoming: upcomingData.data,
        blogs: blogs.data,
        archivedEvents: archivedEvents.data,
      },
      pagination: {
        past: pastData.pagination,
        upcoming: upcomingData.pagination,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

const single = async (req, res) => {
  try {
    let data = await Post.findById({ _id: req.params.id });

    const latestPosts = await Post.find({
      post_type: data.post_type,
    })
      .sort({ createdAt: -1 }) // Sort in descending order based on creation date
      .limit(3);

    return res.json({
      status: 200,
      message: "success",
      data: data,
      recent: latestPosts,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
      data: [],
    });
  }
};

const update = async (req, res) => {
  let { id } = req.params;
  try {
    let checkPost = await Post.findById({ _id: id });
    if (!checkPost)
      return res.json({ status: 404, message: "post not found", data: {} });

    // // check if data isArchive  == true

    // if(req.body.isArchive == true)
    // {

    //     let posdData = await Post.findByIdAndDelete({
    //         _id : checkPost._id
    //     })

    //     return res.json({
    //         status : 200,
    //         message  : 'success',
    //         data : posdData
    //     })
    // }

    if (req.files) {
      let picture = req.files.picture;
      const dirOne = "public/posts";
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

        req.body.picture = `posts/${imageName}`;
      }
    }

    if (checkPost.post_type == "event") {
      let newLocation = req.body.fullAddress
        ? req.body.fullAddress
        : req.body.location;
      console.log(req.body);
      if (req.body.location || req.body.fullAddress) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          newLocation
        )}&key=${process.env.Map_API}`;
        const response = await axios.get(url);
        if (response.data.status !== "OK") {
          return res.json({
            status: 500,
            message: `Invalid Address ${req.body.location}`,
            data: {},
          });
        }
        const location = response.data.results[0].geometry.location;

        req.body.latitude = location.lat;
        req.body.longitude = location.lng;
      }
    }

    let post = await Post.findByIdAndUpdate(
      {
        _id: checkPost._id,
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
      data: post,
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
  try {
    let data = await post.findByIdAndDelete({ _id: req.params.id });
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

export default {
  store,
  index,
  single,
  update,
  adminPosts,
  destroy,
};
