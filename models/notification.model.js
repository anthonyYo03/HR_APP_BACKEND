import mongoose from "mongoose";
const {Schema}=mongoose;

const notificationSchema=new Schema({

recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

type: { type: String, 

enum:[
"DEFAULT",
"CREATE_ANNOUNCEMENT","UPDATE_ANNOUNCEMENT",
"NEW_REPORTED_ISSUE","UPDATE_REPORT_ISSUE_STATUS",
"NEW_LEAVE_REQUEST","UPDATED_LEAVE_REQUEST","UPDATE_STATUS_LEAVE_REQUEST",
"NEW_TASK","UPDATE_TASK","UPDATE_TASK_STATUS"
],
default: 'DEFAULT' },
title: { type: String, required: true },
message: { type: String, required: true },
relatedId: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedModel' },
relatedModel: { type: String, enum: ['Announcement', 'Task', 'Request', 'ReportIssue'] },
isRead: { type: Boolean, default: false },  
isHidden: {type: Boolean,default: false}
},{timestamps:true})

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ relatedId: 1, relatedModel: 1 });

const Notification=mongoose.model("Notification",notificationSchema);
export default Notification;