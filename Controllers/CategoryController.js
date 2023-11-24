const { default: mongoose } = require("mongoose");
const Category = require("../Models/CategoryModel");

// Create a new category

exports.createCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const categories = new Category({ category });
    await categories.save();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error creating category" });
  }
};

// Get all categories

exports.getCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching categories" });
  }
};

//Get Single Category

exports.getSingleCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const categoryId = new mongoose.Types.ObjectId(id);

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching category" });
  }
};

//Edit Category

exports.editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { category },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating category" });
  }
};

//Delete Category

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndRemove(id);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting category" });
  }
};
