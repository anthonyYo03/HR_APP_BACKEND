import mongoose from "mongoose";
const {Schema}=mongoose

const reportIssueSchema=new Schema({

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
status:{
type:String,
enum:["pending","in_progress","resolved"],
default:"pending"
},

priority:{
    type:String,
    enum:["low","medium","high"],
    default:"medium"

},
reportedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
},{timestamps:true});

const ReportIssue=mongoose.model("ReportIssue",reportIssueSchema);

export default ReportIssue;