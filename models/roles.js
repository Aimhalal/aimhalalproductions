import mongoose from "mongoose";

const roles = new mongoose.Schema({
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  default_code: {
    type: Number,
    unique: true,
  },
  types: [
    {
      series: {
        type: Number,
        default: 0,
      },
      name: {
        type: String,
        enum: ["butcher", "restaurant", "pharmacist"],
      },
      image: {
        type: String,
        default: "",
      },
    },
  ],
});
export default mongoose.model("roles", roles);
