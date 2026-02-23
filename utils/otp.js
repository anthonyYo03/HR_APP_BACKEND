import crypto from "crypto";

export const generateOTP = () => {
  // Generate 6-digit random OTP
  return crypto.randomInt(100000, 999999).toString();
};