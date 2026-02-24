import mongoose from "mongoose";
const {Schema}=mongoose;
const taskSchema=new Schema({

createdBy:{
type:mongoose.Schema.Types.ObjectId,
ref:'User', 
required:true
},

name:{
type:String,
trim:true,
required:true
},

description:{
type:String,
trim:true,
required:true
},

status:{
    type:String,
    enum:['pending','in-progress','completed'],
    default:'pending'
},

completedAt: {
     type: Date,
     default: null
   },



dueDate:{
type:Date,
required:true
},

priority: {
     type: String,
     enum: ['low', 'medium', 'high'],
     default: 'medium'
   },




assignedTo:{
type:mongoose.Schema.Types.ObjectId,
ref:'User', 
required:true
}
},{timestamps:true})


taskSchema.pre('save', async function() {
  if (this.isModified('status') && this.status === 'completed') {
    this.completedAt = new Date();
  }
});

taskSchema.index({ createdBy: 1 });
taskSchema.index({ name: "text" });


const Task=mongoose.model("Task",taskSchema);

export default Task;