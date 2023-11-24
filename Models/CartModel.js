const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    products: [
      {
        productId: {
          type: String,
        },
        model: {
          type: String,
        },
        description: {
          type: String,
        },
        imageUrl: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
        },
        sale_price: {
          type: Number,
        },
      },
    ],
    totalAmount: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model("cartDetails", cartSchema);

module.exports = Cart;
