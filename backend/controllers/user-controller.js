const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/Utilizator");
const { Op } = require('sequelize');

const SECRET_KEY = "cheia_super_secreta"; 

// Email configuration
// Email configuration - COMPLETE FIXED VERSION
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify the transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

exports.registerUser = async (req, res) => {
  try {
    console.log("Cerere primita:", req.body);

    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already used!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });
    
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, SECRET_KEY, { expiresIn: "1h" });
    
    console.log("Utilizator creat:", newUser);

    res.status(201).json({ 
      message: "Successful registration!", 
      token
    });
  } catch (error) {
    console.error("Eroare la înregistrare:", error);
    res.status(500).json({ message: "Registration error", error });
  }
};

exports.loginUser = async (req, res) => {
  try {
    console.log("Cerere primita", req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(400).json({ message: "Incorrect email or password!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect email or password!" });
    
    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: "Successful registration", token });
  } catch (error) {
    res.status(500).json({ message: "Authentication error", error });
  }
};

// 📌 Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Password is set" : "Password is NOT set");

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "There is no account with this email!" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user (you'll need to add these fields to your User model)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password',
      html: `
        <h2>Reset Password</h2>
        <p>You have requested a password reset for your account.</p>
        <p>You can change your password by clicking <a href="${resetURL}">here</a></p>
        <p>If you can't click on the link, copy the following address into your browser:</p>
        <p>${resetURL}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: "I've sent you an email with instructions for resetting your password!" 
    });

  } catch (error) {
    console.error("Eroare la trimiterea emailului:", error);
    res.status(500).json({ message: "Error sending email", error: error.message });
  }
};

// 📌 Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "The passwords don't match!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "The password must be at least 6 characters long!" });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token!" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password has been changed successfully!" });

  } catch (error) {
    console.error("Eroare la resetarea parolei:", error);
    res.status(500).json({ message: "Password reset error", error: error.message });
  }
};

// 📌 Obținerea datelor utilizatorului
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: ["id", "username", "email"] });
    if (!user) return res.status(404).json({ message: "Utilizator inexistent!" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Eroare la preluarea datelor utilizatorului", error });
  }
};

// 📌 Actualizare utilizator
exports.updateUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) return res.status(404).json({ message: "Utilizator inexistent!" });

    user.username = username || user.username;
    user.email = email || user.email;
    await user.save();

    res.json({ message: "Profil actualizat!", user });
  } catch (error) {
    res.status(500).json({ message: "Eroare la actualizare", error });
  }
};

// 📌 Ștergere utilizator
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) return res.status(404).json({ message: "Utilizator inexistent!" });

    await user.destroy();
    res.json({ message: "Utilizator șters cu succes!" });
  } catch (error) {
    res.status(500).json({ message: "Eroare la ștergere", error });
  }
};

// 📌 Căutare utilizatori după username
exports.searchUsers = async (req, res) => {
  try {
    console.log("Search query:", req.query);
    const { q, exclude } = req.query;
    
    const users = await User.findAll({
      where: {
        username: {
          [Op.like]: `%${q}%`
        },
        ...(exclude && { id: { [Op.not]: exclude } })
      },
      attributes: ['id', 'username'],
      limit: 10
    });

    console.log("Found users:", users);
    res.status(200).json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Error searching users", error: error.message });
  }
};