const SubCategory = require("../Models/SubCategory");

//Create Sub-Category

exports.createSubCategory = async (req, res) => {
  try {
    const { Brand, categoryId } = req.body;
    const subCategory = new SubCategory({ Brand, category: categoryId });
    await subCategory.save();
    res.status(200).json(subCategory);
  } catch (error) {
    res.status(500).json({ error: "Error creating sub-category" });
  }
};

//Get all Sub-Categories

exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find().populate("category");
    res.status(200).json(subCategories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching sub-categories" });
  }
};

//Get Single Sub-

exports.getSingleSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id).populate("category");

    if (!subCategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    res.status(200).json(subCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching subcategory" });
  }
};

//Edit Sub-Categories

exports.editSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { Brand, categoryId } = req.body;

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { Brand, category: categoryId },
      { new: true }
    );

    if (!updatedSubCategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    res.status(200).json(updatedSubCategory);
  } catch (error) {
    res.status(500).json({ error: "Error updating subcategory" });
  }
};

//Delete Sub-Category

exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSubCategory = await SubCategory.findByIdAndRemove(id);

    if (!deletedSubCategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting subcategory" });
  }
};
