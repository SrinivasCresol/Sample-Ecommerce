const users = require("../Models/AuthModel");
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRETKEY;

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const verifyToken = jwt.verify(token, secretKey);

    const rootUser = await users.findOne({ _id: verifyToken._id });

    if (!rootUser) {
      throw new Error("User Not Found!");
    }

    req.token = token;
    req.rootUser = rootUser;
    req.userId = rootUser._id;

    next();
  } catch (error) {
    return res.status(500).json({ message: "Unauthorized no Token Provided" });
  }
};

module.exports = authenticate;
