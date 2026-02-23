import mongoose from "mongoose";



const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role:{
        type:String,
        enum:["HR","Employee"],
        default:"Employee"
    },
    password: {
      type: String,
      required: true,
    },
   otp: { type: String },
   otpExpires: { type: Date },
   isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);


const User = mongoose.model("User", userSchema);

export default User;