const express = require("express");
const router = new express.Router();

const AuthController = require("../Controllers/AuthController");
const AccountController = require("../Controllers/AccountController");
const CategoryController = require("../Controllers/CategoryController");
const SubCategoryController = require("../Controllers/SubCategoryController");
const ProductController = require("../Controllers/ProductControllers");
const paymentController = require("../Controllers/PaymentController");
const orderController = require("../Controllers/OrdersController");
const cartController = require("../Controllers/CartController");
const authenticate = require("../Middleware/Authenticate");
const upload = require("../Multer/FileUpload");
const forgotController = require("../Controllers/ForgotController");

//Auth Routers

router.post("/user/register", AuthController.userRegister);

router.post("/user/login", AuthController.userLogin);

router.post(
  "/user/password-change",
  authenticate,
  AuthController.changePassword
);

//Forgot Password Routers

router.post("/user/forgot-password", forgotController.forgotPassword);

router.post("/user/reset-password/:id/:token", forgotController.resetPassword);

//Account Details Routers

router.post(
  "/user/create-address",
  authenticate,
  AccountController.createAddress
);

router.get("/user/get-address/:userId", AccountController.getAddress);

router.put(
  "/user/edit-details/:addressId",
  authenticate,
  AccountController.editDetails
);

router.delete(
  "/user/delete-details/:addressId",
  authenticate,
  AccountController.deleteDetails
);

//Category Routers

router.post("/add/category", authenticate, CategoryController.createCategory);

router.get("/get/category", CategoryController.getCategory);

router.get("/get/category/:id", CategoryController.getSingleCategory);

router.put("/edit/category/:id", authenticate, CategoryController.editCategory);

router.delete(
  "/delete/category/:id",
  authenticate,
  CategoryController.deleteCategory
);

//Sub Category Routers

router.post(
  "/add/sub-category",
  authenticate,
  SubCategoryController.createSubCategory
);

router.get("/get/sub-category", SubCategoryController.getAllSubCategories);

router.get("/get/sub-category/:id", SubCategoryController.getSingleSubCategory);

router.put(
  "/edit/sub-category/:id",
  authenticate,
  SubCategoryController.editSubCategory
);

router.delete(
  "/delete/sub-category/:id",
  authenticate,
  SubCategoryController.deleteSubCategory
);

//Product Routers

router.post(
  "/add/products",
  authenticate,
  upload.array("poster", 5),
  ProductController.createProduct
);

router.get("/get/products", ProductController.getAllProducts);

router.get("/get/product/:id", ProductController.getSingleProduct);

router.put(
  "/update/product/:id",
  authenticate,
  upload.single("poster"),
  ProductController.updateProduct
);

router.delete(
  "/delete/product/:id",
  authenticate,
  ProductController.deleteProduct
);

//Payment Router

router.post("/checkout-session", authenticate, paymentController.makePayment);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleEvents
);

//Order Router

router.get("/get/orders/:id", orderController.getOrders);

router.get("/get/orders", orderController.getAllOrders);

//Cart Router

router.post("/add/cart", authenticate, cartController.addCartData);

router.get("/get/cart/:id", authenticate, cartController.getCartData);

router.get("/get/cart", authenticate, cartController.getAllData);

router.put(
  "/update/cart/:id/:productId",
  authenticate,
  cartController.updateCart
);

router.delete(
  "/delete/cart/:id/:productId",
  authenticate,
  cartController.deleteCartItem
);

router.delete("/clear/cart/:id", authenticate, cartController.clearUserCart);

module.exports = router;
