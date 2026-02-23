import Request from "../models/request.model.js";
import User from "../models/user.model.js";
import { getAllHRIds,sendNotification } from "../services/notification.service.js";


const createRequest = async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  const userId = req.userId;

  try {
    const request = await Request.create({ reportedBy: userId, leave_type, start_date, end_date, reason });

    // Notify HR about the new leave request
    const hrIds = await getAllHRIds();
    await sendNotification({
      recipients: hrIds,
      type: "NEW_LEAVE_REQUEST",
      title: "New Leave Request",
      message: `A new leave request has been submitted: ${leave_type}`,
      relatedId: request._id,
      relatedModel: "Request"
    });

    // Notify the employee their request was submitted
    await sendNotification({
      recipients: [userId],
      type: "NEW_LEAVE_REQUEST",
      title: "Leave Request Submitted",
      message: `Your leave request has been submitted successfully: ${leave_type}`,
      relatedId: request._id,
      relatedModel: "Request"
    });

    res.status(201).send({ message: "Request created successfully" });
  } catch (error) {
    res.status(500).send({ message: `Cannot create request: ${error}` });
  }
};


const getAllRequests=async(req,res)=>{

try {
    const allRequest=await Request.find({});
if(allRequest.length===0){
    return res.status(200).send("No Requests Found");
}

res.status(200).send({allRequest});


} catch (error) {
    res.status(500).send({message:`Cannot get Requests ${error}`})
}

}
const getMyRequests=async(req,res)=>{

const id=req.userId;
try {
    const myRequests=await Request.find({reportedBy:id})
    if(myRequests.length===0){
        return res.status(200).send({message:"No Requests Found"});
    }
    res.status(200).send({myRequests});
} catch (error) {
    res.status(500).send({message:`Cannot get Requests ${error}`})
}

}
const getOneRequest=async(req,res)=>{

const {id}=req.params;
try {
    const myRequests=await Request.findById(id)
    if(!myRequests){
        return res.status(404).send({message:"No Requests Found"});
    }

     // 
    const user = await User.findById(req.userId);
    const isHR = user.role === "HR";
    const isAssigned = myRequests.reportedBy.toString() === req.userId;
    if (!isHR && !isAssigned) {
      return res.status(403).send({ message: "Access Denied!" });
    }
    //



    res.status(200).send({myRequests});
} catch (error) {
    res.status(500).send({message:`Cannot get Requests ${error}`})
}
    
}

const editMyRequest=async(req,res)=>{

const {leave_type,start_date,end_date,reason}=req.body;
const {id}=req.params;
const userId = req.userId;
try {

    
   const existing = await Request.findById(id);
   if (!existing) return res.status(404).send({ message: "Request not found" });
    if(existing.status=="Approved" || existing.status=="Rejected"){
        return res.status(403).send({message:"Cannot edit request.Request status decision already taken by HR"});
    }
     const editRequest=await Request.findByIdAndUpdate({_id:id},{leave_type,start_date,end_date,reason},{new:true})

 const hrIds = await getAllHRIds();
    await sendNotification({
      recipients: hrIds,
      type: "UPDATED_LEAVE_REQUEST",
      title: "Leave Request Updated",
      message: `Leave request has been updated: ${leave_type}`,
      relatedId: editRequest._id,
      relatedModel: "Request"
    });

    // Notify the employee their request was submitted
    await sendNotification({
      recipients: [userId],
      type: "UPDATED_LEAVE_REQUEST",
      title: "Leave Request Updated",
      message: `Your leave request has been updated successfully: ${leave_type}`,
      relatedId: editRequest._id,
      relatedModel: "Request"
    });


    res.status(200).send({message:"Request edited succesfully"});
} catch (error) {
    res.status(500).send({message:`Cannot edit Requests ${error}`})
}

}

const hrRequestUpdate = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const approvedBy = req.userId;

  try {
    const hrRequest = await Request.findByIdAndUpdate(
      { _id: id },
      { status, approvedBy, approvedDate: Date.now() },
      { new: true }
    );

    if (!hrRequest) {
      return res.status(404).send({ message: "Request not found" });
    }

    // Notify the employee who made the request
    await sendNotification({
      recipients: [hrRequest.reportedBy],
      type: "UPDATE_STATUS_LEAVE_REQUEST",
      title: "Leave Request Status Updated",
      message: `Your leave request status has been updated to: ${status}`,
      relatedId: hrRequest._id,
      relatedModel: "Request"
    });

    res.status(200).send({ message: "Request updated successfully" });
  } catch (error) {
    res.status(500).send({ message: `Cannot update request: ${error}` });
  }
};

const deleteRequest=async(req,res)=>{

const {id}=req.params;

try {
    const deleteRequest=await Request.findByIdAndDelete({_id:id});
    if(!deleteRequest){
        return res.status(404).send({message:"No Requests Found"});
    }
    res.status(200).send({message:"Request deleted succesfully"});
} catch (error) {
    res.status(500).send({message:`Cannot delete Requests ${error}`})
}

}


export const requestControllers={
createRequest,getAllRequests,getMyRequests,getOneRequest,
editMyRequest,hrRequestUpdate,deleteRequest}