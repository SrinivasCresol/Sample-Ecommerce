const AccountDetails = require("../Models/AccountDetailsModel");
const User = require("../Models/AuthModel");

// Create a new address for a user

exports.createAddress = async (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    phoneNumber,
    buildingAddress,
    streetAddress,
    city,
    state,
    postalCode,
    country,
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAddress = new AccountDetails({
      user: user._id,
      firstName,
      lastName,
      phoneNumber,
      buildingAddress,
      streetAddress,
      city,
      state,
      postalCode,
      country,
    });

    await newAddress.save();
    user.addresses.push(newAddress._id);

    user.address = {
      firstName,
      lastName,
      phoneNumber,
      buildingAddress,
      streetAddress,
      city,
      state,
      postalCode,
      country,
    };

    await user.save();
    res.status(200).json({ message: "Address Created Successfully" });
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ message: "Error Creating Address" }, error);
  }
};

// Get Address Based on User

exports.getAddress = async (req, res) => {
  const userId = req.params.userId;

  try {
    const addresses = await AccountDetails.find({ user: userId });

    if (!addresses) {
      return res
        .status(404)
        .json({ message: "Addresses not found for this user" });
    }

    res.status(200).json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Error fetching addresses" });
  }
};

//Edit Details

exports.editDetails = async (req, res) => {
  const addressId = req.params.addressId;
  const updatedData = req.body;

  try {
    const updatedAddress = await AccountDetails.findByIdAndUpdate(
      addressId,
      updatedData,
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not Found" });
    }

    res
      .status(200)
      .json({ updatedAddress, message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Error updating address" });
  }
};

//Delete Details

exports.deleteDetails = async (req, res) => {
  const addressId = req.params.addressId;

  try {
    const deletedAddress = await AccountDetails.findByIdAndRemove(addressId);

    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Error deleting address" });
  }
};
