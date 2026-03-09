import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middlewares/auth.js';
import { generateOTP } from '../utils/otp.js';
import { secretKey } from '../middlewares/config.js';
import validator from "validator";
import nodemailer from 'nodemailer';

// ─── Shared transporter (created once, reused) ───────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // CRITICAL: Add timeouts so it never hangs forever
  connectionTimeout: 10000, // 10s to connect
  greetingTimeout: 10000,   // 10s for SMTP greeting
  socketTimeout: 15000,     // 15s for socket inactivity
});

// ─── Helper: send OTP email ───────────────────────────────────────────────────
const sendOTPToEmail = async (email, otp) => {
  // NOTE: removed transporter.verify() — it causes hangs and is not needed per send
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your email',
    html: `
      <h3>Email Verification</h3>
      <p>Your OTP is:</p>
      <h2>${otp}</h2>
      <p>Expires in 10 minutes.</p>
    `,
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const hash = await bcrypt.hash(password, 10);

    await User.create({
      email,
      username,
      password: hash,
      otp,
      otpExpires,
      isVerified: false,
    });

    // Send email FIRST — if it fails, return error immediately (don't leave user stuck)
    try {
      await sendOTPToEmail(email, otp);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError.message);
      // Clean up the unverified user so they can retry registration
      await User.deleteOne({ email });
      return res.status(500).send({
        message: 'Account created but failed to send verification email. Please try again.',
      });
    }

    console.log(`✅ OTP sent to ${email}`);
    res.status(201).send({
      message: 'User registered. Please verify OTP sent to your email.',
      email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `An error occurred: ${error.message}` });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.isVerified) return res.status(400).send({ message: 'User already verified' });
    if (user.otp !== otp) return res.status(400).send({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpires) return res.status(400).send({ message: 'OTP has expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).send({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `An error occurred: ${error.message}` });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(404).send({ message: 'User not found' });
    if (!user.isVerified) return res.status(403).send({ message: 'Please verify your email first' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).send({ message: 'Invalid login credentials' });

    const token = generateToken({ userId: user._id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 6 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: 'Login successful', role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `An error occurred while logging in: ${error.message}` });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutUser = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'An error occurred while logging out' });
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOTPToEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.isVerified) return res.status(400).send({ message: 'User is already verified' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    try {
      await sendOTPToEmail(email, otp);
    } catch (emailError) {
      console.error('❌ Failed to resend OTP:', emailError.message);
      return res.status(500).send({ message: 'Failed to send OTP email. Please try again.' });
    }

    res.status(200).send({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `Cannot send OTP: ${error.message}` });
  }
};

// ─── Request Password Reset ───────────────────────────────────────────────────
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User doesn't exist" });

    const secret = secretKey + user.password;
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?id=${user._id}&token=${token}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h3>Password Reset Request</h3>
          <p>Click the link below to reset your password:</p>
          <a href="${resetURL}">Reset Password</a>
          <p>Link: ${resetURL}</p>
          <p>Expires in 1 hour.</p>
        `,
      });
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError.message);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { id, token } = req.query;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: 'Password is required' });
  if (!id || !token) return res.status(400).json({ message: 'Invalid reset link' });
  if (!validator.isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password is too weak' });
  }

  try {
    const user = await User.findOne({ _id: id });
    if (!user) return res.status(400).json({ message: 'User does not exist!' });

    const secret = secretKey + user.password;
    try {
      jwt.verify(token, secret);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: id }, { $set: { password: encryptedPassword } });

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// ─── Get Users ────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'Employee' });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `An error occurred: ${error}` });
  }
};

export const userControllers = {
  registerUser,
  verifyOTP,
  loginUser,
  logoutUser,
  getUsers,
  requestPasswordReset,
  resetPassword,
  resendOTPToEmail,
};