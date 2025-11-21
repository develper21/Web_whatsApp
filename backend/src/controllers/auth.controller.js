import crypto from "crypto";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import { dispatchOtp } from "../services/otp.service.js";

const OTP_LENGTH = Number(process.env.OTP_LENGTH) || 6;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
const OTP_RESEND_INTERVAL_SECONDS = Number(process.env.OTP_RESEND_INTERVAL_SECONDS) || 60;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

const sanitizePhoneNumber = (phone) => phone?.replace(/\s|-/g, "");
const isValidPhoneNumber = (phone) => /^\+?\d{8,15}$/.test(phone || "");
const generateOtp = () =>
  crypto
    .randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");

const buildUserResponse = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  phoneNumber: user.phoneNumber,
  profilePic: user.profilePic,
  createdAt: user.createdAt,
});

export const requestOtp = async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    phoneNumber = sanitizePhoneNumber(phoneNumber);

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: "Please provide a valid phone number with country code" });
    }

    let user = await User.findOne({ phoneNumber });

    if (user?.lastOtpSentAt) {
      const secondsSinceLastOtp = (Date.now() - user.lastOtpSentAt.getTime()) / 1000;
      if (secondsSinceLastOtp < OTP_RESEND_INTERVAL_SECONDS) {
        const waitTime = Math.ceil(OTP_RESEND_INTERVAL_SECONDS - secondsSinceLastOtp);
        return res.status(429).json({ message: `Please wait ${waitTime}s before requesting a new OTP` });
      }
    }

    if (!user) {
      user = new User({ phoneNumber });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    user.otpHash = otpHash;
    user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpAttemptCount = 0;
    user.lastOtpSentAt = new Date();

    await user.save();

    await dispatchOtp(phoneNumber, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log("Error in requestOtp controller", error.message);
    res.status(500).json({ message: "Unable to send OTP. Please try again later." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    let { phoneNumber, otp, fullName } = req.body;
    phoneNumber = sanitizePhoneNumber(phoneNumber);
    otp = otp?.trim();

    if (!isValidPhoneNumber(phoneNumber) || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user || !user.otpHash) {
      return res.status(400).json({ message: "OTP has not been requested for this number" });
    }

    if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.otpAttemptCount >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many incorrect attempts. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash);

    if (!isMatch) {
      user.otpAttemptCount += 1;
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (fullName && typeof fullName === "string") {
      user.fullName = fullName.trim();
    }

    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttemptCount = 0;
    user.lastOtpSentAt = undefined;

    await user.save();

    generateToken(user._id, res);

    res.status(200).json(buildUserResponse(user));
  } catch (error) {
    console.log("Error in verifyOtp controller", error.message);
    res.status(500).json({ message: "Unable to verify OTP. Please try again later." });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName } = req.body;
    const userId = req.user._id;

    if (!profilePic && !fullName) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatePayload = {};

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updatePayload.profilePic = uploadResponse.secure_url;
    }

    if (typeof fullName === "string") {
      updatePayload.fullName = fullName.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true });

    res.status(200).json(buildUserResponse(updatedUser));
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(buildUserResponse(req.user));
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
