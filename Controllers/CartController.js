const Cart = require("../Models/CartModel");

// Create Cart Data

exports.addCartData = async (req, res) => {
  try {
    const { userId, userName, userMail, product } = req.body;
    const cart = await Cart.findOne({ userID: userId });

    if (!cart) {
      // If the user doesn't have a cart, create a new one
      const newCart = new Cart({
        userID: userId,
        name: userName,
        email: userMail,
        products: [product],
        totalAmount: product.sale_price
          ? product.sale_price * product.quantity
          : product.price * product.quantity,
      });
      await newCart.save();
      res.status(200).json(newCart);
    } else {
      // If the user already has a cart, update it
      cart.products.push(product);
      (cart.totalAmount += product.sale_price
        ? product.sale_price * product.quantity
        : product.price * product.quantity),
        await cart.save();
      res.status(200).json(cart);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Get Cart Data based on User

exports.getCartData = async (req, res) => {
  const { id } = req.params;

  try {
    const cart = await Cart.findOne({ userID: id });

    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart Details are not found for this User" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching Cart Details" });
  }
};

//Get all Cart Data

exports.getAllData = async (req, res) => {
  try {
    const getCartData = await Cart.find();
    res.status(200).json(getCartData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching Cart Details" });
  }
};

// Update Cart Data

exports.updateCart = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userID: id });

    if (!cart) {
      res.status(404).json({ message: "Cart not Found!" });
      return;
    }

    const productIndex = cart.products.findIndex(
      (p) => p.productId === productId
    );

    if (productIndex === -1) {
      res.status(404).json({ message: "Product not found in Cart" });
      return;
    }

    cart.products[productIndex].quantity = quantity;
    cart.totalAmount = cart.products.reduce(
      (total, product) =>
        total + product.sale_price
          ? product.sale_price * product.quantity
          : product.price * product.quantity,
      0
    );

    await cart.save();
    res.status(200).json({ message: "Data Updated Successfully", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Delete Cart Data

exports.deleteCartItem = async (req, res) => {
  try {
    const { id, productId } = req.params;

    const cart = await Cart.findOne({ userID: id });

    if (!cart) {
      res.status(404).json({ message: "Cart not Found!" });
      return;
    }

    const productIndex = cart.products.findIndex(
      (p) => p.productId === productId
    );

    if (productIndex === -1) {
      res.status(404).json({ message: "Product not found in cart" });
      return;
    }

    const deletedProduct = cart.products.splice(productIndex, 1)[0];
    cart.totalAmount = cart.products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );

    await cart.save();
    res.status(200).json({ message: "Product Deleted Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

//Clear Cart Data

exports.clearUserCart = async (req, res) => {
  try {
    const { id } = req.params;

    const cart = await Cart.findOne({ userID: id });

    if (!cart) {
      res.status(404).json({ message: "Cart not Found!" });
      return;
    }

    cart.products = [];
    cart.totalAmount = 0;

    await cart.save();
    res.status(200).json({ message: "Cart Cleared Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
