import User from "../models/user.model.js";


export const OnlyHR = async(req, res, next) => {

    const user=await User.findById(req.userId);
  if (!user || user.role !== "HR") {
    return res.status(403).json({ message: "Access Denied! Only HR are allowed for that action." });
  }
  next();
};

