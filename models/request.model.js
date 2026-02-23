import mongoose from "mongoose";
const {Schema}=mongoose

const requestSchema=new Schema({

reportedBy:{
type:mongoose.Schema.Types.ObjectId,
ref:'User',
required:true
},

leave_type:{
type:String,
enum:["Sick", "Vacation", "Casual"]
},

start_date:{
    type:Date,
    required:true
},
end_date:{
    type:Date,
    required:true
},

status:{
    type:String,
    enum:["Pending","Approved","Rejected"],
    default:"Pending"
},

approvedBy:{
type:mongoose.Schema.Types.ObjectId,
ref:'User', 
},

approvedDate:{
type:Date
},

reason:{
type:String,
required:true,
trim:true
}


},{timestamps:true})


const Request=mongoose.model("Request",requestSchema);

export default Request;