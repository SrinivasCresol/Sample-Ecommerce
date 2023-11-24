const Order = require("../Models/OrdersModel");
const mongoose = require("mongoose");

//Get Order Details Per User

exports.getOrders = async (req, res) => {
  const { id } = req.params;

  try {
    const userID = new mongoose.Types.ObjectId(id);

    const orders = await Order.find({ userID });

    if (!orders) {
      return res
        .status(404)
        .json({ message: "Order Details are not found for this User" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching Orders Details" });
  }
};

//Get All Orders

exports.getAllOrders = async (req, res) => {
  try {
    const getOrders = await Order.find();
    res.status(200).json(getOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching Orders Details" });
  }
};
