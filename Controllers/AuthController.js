const users = require("../Models/AuthModel");
const bcrypt = require("bcryptjs");

// Register User
exports.userRegister = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new users({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(200).send("User Registered Successfully");
  } catch (error) {
    console.error("Error Registering User:", error);
    res.status(500).send("Error Registering User");
  }
};

// Login User

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const validateUser = await users.findOne({ email: email });

    if (validateUser) {
      const isMatch = await bcrypt.compare(password, validateUser.password);

      if (!isMatch) {
        res.status(422).json({ message: "Invalid Details" });
      } else {
        const token = await validateUser.generateAuthToken();
        res.cookie("userCookie", token, {
          expires: new Date(Date.now() + 300000),
          httpOnly: true,
        });
        const result = { validateUser, token };
        res.status(200).json({ result, message: "Login Successful!" });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: "Login Failed!" });
  }
};

// Change Password

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const user = req.rootUser;

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old Password is incorrect" });
    }

    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ message: "New password and Confirm Password do not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({ message: "Password Changed Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Password Change Failed!" });
  }
};
