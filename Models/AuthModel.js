const mongoose = require("mongoose");
const secretKey = process.env.SECRETKEY;
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccountDetails",
      },
    ],
  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = async function () {
  try {
    const token = jwt.sign({ _id: this._id }, secretKey);

    if (!token) {
      throw new Error("Token not Generated");
    }

    return token;
  } catch (error) {
    console.error("Token Generation Error:", error);
    throw new Error("Token generation error");
  }
};

const users = new mongoose.model("users", userSchema);

module.exports = users;
