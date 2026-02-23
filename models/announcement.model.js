import mongoose from "mongoose";
const {Schema}=mongoose;

const announcementSchema=new Schema({

title:{
    type:String,
    required:true,
    trim:true
},

description:{
    type:String,
    required:true,
    trim:true
},

createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
},
{timestamps:true}

)

const Announcement = mongoose.model("Announcement",announcementSchema);
export default Announcement;