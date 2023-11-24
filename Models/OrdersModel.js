const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
    },
    customerId: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    mobileNo: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    paymentID: {
      type: String,
    },
    clientSecret: {
      type: String,
    },
    paymentMethodTypes: {
      type: Object,
    },
    receiptUrl: {
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
        quantity: {
          type: Number,
        },
      },
    ],
    billingAddress: {
      type: [
        {
          line1: String,
          line2: String,
          city: String,
          postal_code: String,
          state: String,
          country: String,
        },
      ],
    },
    shippingAddress: {
      type: [
        {
          line1: String,
          line2: String,
          city: String,
          postal_code: String,
          state: String,
          country: String,
        },
      ],
    },
    paymentDetails: {
      type: [
        {
          code: String,
          declinedCode: String,
          message: String,
        },
      ],
    },
    totalAmount: {
      type: Number,
    },
    shipping: {
      type: Object,
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
    delivery_status: {
      type: String,
      default: "pending",
    },
    cancelledAt: {
      type: String,
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("orders", orderSchema);

module.exports = Order;
