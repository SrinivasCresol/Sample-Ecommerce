const users = require("../Models/AuthModel");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const jwt_secret_key = process.env.SECRETKEY;
const bcrypt = require("bcryptjs");

//Forgot Password

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const validateUser = await users.findOne({ email: email });
    if (!validateUser) {
      return res.status(404).json({ message: "User not Existed" });
    }
    const token = jwt.sign({ id: validateUser._id }, jwt_secret_key, {
      expiresIn: "300s",
    });
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL,
        pass: process.env.PASS,
      },
    });

    var mailOptions = {
      from: process.env.MAIL,
      to: email,
      subject: "Reset Password Link",
      text: `http://localhost:3000/user/reset-password/${validateUser._id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to send email" });
      } else {
        return res.status(200).json({ Status: "Success" });
      }
    });
  } catch (error) {
    console.error("Password Change Failed:", error);
    return res.status(500).json({ message: "Password Change Failed!" });
  }
};

//Reset Password

exports.resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password, confirmPassword } = req.body.inputValue;

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and Confirm Password do not match" });
    }

    jwt.verify(token, jwt_secret_key, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await users.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({ message: "Password updated successfully" });
    });
  } catch (error) {
    console.error("Password Change Failed:", error);
    return res.status(500).json({ message: "Password Change Failed!" });
  }
};
