import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middlewares/auth.js';
import { generateOTP } from '../utils/otp.js';
import { Resend } from 'resend';
import { secretKey } from '../middlewares/config.js';

const registerUser = async (req, res) => {
  const { email, username, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hash = await bcrypt.hash(password, 10);

    // Create user but mark as NOT verified
    await User.create({ 
      email, 
      username, 
      password: hash, 
      otp,
      otpExpires,
      isVerified: false 
    });
   await sendOTPToEmail(email, otp);
    // TODO: Send OTP via email here
    console.log(`OTP for ${email}: ${otp}`);

    res.status(201).send({ 
      message: 'User registered. Please verify OTP sent to your email.',
      email // Send email back so frontend knows where to send verification
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `An error occurred!! ${error}` });
  }
};

// NEW: Verify OTP endpoint
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).send({ message: 'User already verified' });
    }

    // Check if OTP matches and hasn't expired
    if (user.otp !== otp) {
      return res.status(400).send({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).send({ message: 'OTP has expired' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).send({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `An error occurred!! ${error}` });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).send({ message: 'Please verify your email first' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).send({ message: 'Invalid login credentials' });
    }

    const payload = { userId: user._id };
    const token = generateToken(payload);
    res.cookie('token', token, { httpOnly: true });
    res.status(200).json({ message: 'Login successful',role:user.role });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `An error occurred while logging in ${error}` });
  }
};

const logoutUser = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'An error occurred while logging out' });
  }
}



const sendOTPToEmail = async (email, otp) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'onboarding@resend.dev',
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

const resendOTPToEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).send({ message: "User is already verified" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOTPToEmail(email, otp);

    res.status(200).send({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).send({ message: `Cannot send OTP: ${error}` });
  }
};



const requestPasswordReset = async (req, res) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    const secret = secretKey + user.password;
    const token = jwt.sign(
      { id: user._id, email: user.email },
      secret,
      { expiresIn: '1h' }
    );

    // const resetURL = `${process.env.FRONTEND_URL}/reset-password?id=${user._id}&token=${token}`;

    await resend.emails.send({
      from: 'onboarding@resend.dev', // or your verified domain
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

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('❌ Email Error:', error);
    res.status(500).json({
      message: 'Failed to send email',
      error: error.message
    });
  }
};


const resetPassword = async (req, res) => {
  const { id, token } = req.query;
  const { password } = req.body;

if (!validator.isStrongPassword(password)) {
  return res.status(400).json({ message: "Password is too weak" });
}

  try {
    // Validate inputs
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!id || !token) {
      return res.status(400).json({ message: 'Invalid reset link' });
    }

    
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist!' });
    }

    // Verify token using the same secret (secretKey + old password hash)
    const secret = secretKey + user.password;

    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

 
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await User.updateOne(
      { _id: id },
      { $set: { password: encryptedPassword } }
    );

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}); // Changed from findOne to find
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `An error occurred!! ${error}` });
  }
};

export const userControllers = 
{ registerUser,
  verifyOTP, 
  loginUser,
  logoutUser, 
  getUsers,
  requestPasswordReset,
  resetPassword,
  resendOTPToEmail
};