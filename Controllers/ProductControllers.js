const Product = require("../Models/ProductModel");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Create Product

exports.createProduct = async (req, res) => {
  try {
    if (req.rootUser.role !== "Admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const folder = "Sample_Ecommerce";
    const mainImage = req.files[0];
    const additionalImages = req.files.slice(1);

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const uniqueMainImageFilename = uniqueSuffix + "-" + mainImage.originalname;

    const cloudinaryResponseMain = await cloudinary.uploader.upload(
      mainImage.path,
      {
        folder: folder,
        public_id: uniqueMainImageFilename,
      }
    );

    const mainImageUrl = cloudinaryResponseMain.secure_url;

    const extraImageUrls = [];

    extraImageUrls.push(mainImageUrl);

    for (const image of additionalImages) {
      const uniqueFilename = uniqueSuffix + "-" + image.originalname;
      const extraCloudinaryResponse = await cloudinary.uploader.upload(
        image.path,
        {
          folder: folder,
          public_id: uniqueFilename,
        }
      );
      extraImageUrls.push(extraCloudinaryResponse.secure_url);
    }

    const {
      model,
      description,
      price,
      sale_price,
      product_code,
      units,
      subCategoryId,
    } = req.body;

    const newProduct = new Product({
      model,
      description,
      price,
      sale_price,
      product_code,
      units,
      imageUrl: mainImageUrl,
      gallery: extraImageUrls,
      subCategory: subCategoryId,
    });

    await newProduct.save();

    res.status(200).json({ message: "Product Created Successfully" });
  } catch (error) {
    console.error("Error Creating Product:", error);
    res.status(500).json({ message: "Error Creating Product" });
  }
};

// Get All Products

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("subCategory")
      .populate({
        path: "subCategory",
        populate: { path: "category" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error Getting Products" });
  }
};

// Get Single Product

exports.getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById({ _id: id })
      .populate("subCategory")
      .populate({
        path: "subCategory",
        populate: { path: "category" },
      });

    if (!product) {
      return res.status(404).json({ message: "Product Not Found!" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error Getting Product" });
  }
};

// Update Products

exports.updateProduct = async (req, res) => {
  try {
    if (req.rootUser.role !== "Admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { id } = req.params;
    const {
      model,
      description,
      price,
      sale_price,
      product_code,
      units,
      quantity,
      subCategoryId,
    } = req.body;

    let extraImageUrls = [];

    if (req.files) {
      const folder = "Sample_Ecommerce";

      for (const image of req.files) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const generateUniqueFilename = uniqueSuffix + "-" + image.originalname;
        const uniqueFilename = generateUniqueFilename;

        const cloudinaryResponse = await cloudinary.uploader.upload(
          image.path,
          {
            folder: folder,
            public_id: uniqueFilename,
          }
        );

        extraImageUrls.push(cloudinaryResponse.secure_url);
      }
    }

    let imageUrl = null;

    if (req.file) {
      const uniqueFilename = generateUniqueFilename;

      const folder = "Sample_Ecommerce";

      const cloudinaryResponse = await cloudinary.uploader.upload(
        req.file.path,
        {
          folder: folder,
          public_id: uniqueFilename,
        }
      );

      imageUrl = cloudinaryResponse.secure_url;

      // Optionally, delete the old image if it exists
      const product = await Product.findById(id);
      if (product.imageUrl) {
        const publicId = product.imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: id },
      {
        model,
        description,
        price,
        sale_price,
        units,
        product_code,
        quantity,
        subCategory: subCategoryId,
        ...(imageUrl && { imageUrl }),
        gallery: extraImageUrls,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product Not Found" });
    }

    res.status(200).json({
      product: updatedProduct,
      message: "Product Updated Successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error Updating Product" });
  }
};

//Delete Products

exports.deleteProduct = async (req, res) => {
  try {
    if (req.rootUser.role !== "Admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete({ _id: id });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product Not Found" });
    }

    if (Product.imageUrl) {
      fs.unlinkSync(Product.imageUrl);
    }

    res.status(200).json({ message: "Product Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error Deleting Product" });
  }
};
