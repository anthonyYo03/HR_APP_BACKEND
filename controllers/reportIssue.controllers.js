import ReportIssue from "../models/reportIssue.model.js";
import User from "../models/user.model.js";
import { getAllHRIds,sendNotification } from "../services/notification.service.js";

const createIssue = async (req, res) => {
  const userId = req.userId;
  const { title, description, priority } = req.body;
  try {
    const issue = await ReportIssue.create({ title, description, priority, reportedBy: userId });

    // Get all HR ids
   const hrIds = await getAllHRIds();
    // Notify HR about the new issue
    await sendNotification({
      recipients: hrIds,
      type: "NEW_REPORTED_ISSUE",
      title: "New Issue Reported",
      message: `A new issue has been reported: ${title}`,
      relatedId: issue._id,
      relatedModel: "ReportIssue"
    });

    // Notify the issuer that their issue was submitted
    await sendNotification({
      recipients: [userId],
      type: "NEW_REPORTED_ISSUE",
      title: "Issue Submitted",
      message: `Your issue has been submitted successfully: ${title}`,
      relatedId: issue._id,
      relatedModel: "ReportIssue"
    });

    res.status(201).send({ message: "Issue reported successfully", issue });
  } catch (error) {
    res.status(500).send({ message: `Cannot create issue: ${error}` });
  }
};


const getAllIssues = async (req, res) => {
try{
const allIssues=await ReportIssue.find({}).sort({ createdAt: -1 });
if(allIssues.length===0){
   return res.status(200).send({message:"No issue Found"})
}
res.status(200).send({allIssues});
}
catch(error){
    res.status(500).send({message:`Cannot get all issues:${error}`});
}

}


const getMyIssues = async (req, res) => {
const id=req.userId;
try {
    const myIssues=await ReportIssue.find({reportedBy:id}).sort({ createdAt: -1 })
    if(myIssues.length===0){
    return res.status(200).send({message:"My issues not found"})    
    }
    res.status(200).send({myIssues});

} catch (error) {
    res.status(500).send({message:"Cannot get my issues"})
}

}      


const getOneIssue = async (req, res) => {
const {id}=req.params;
    try{
 const oneIssue=await ReportIssue.findById(id);
 if(!oneIssue){

    return res.status(404).send({message:"Issue Not Found"});
 }

   // 
    const user = await User.findById(req.userId);
    const isHR = user.role === "HR";
    const isAssigned = oneIssue.reportedBy.toString() === req.userId;
    if (!isHR && !isAssigned) {
      return res.status(403).send({ message: "Access Denied!" });
    }
    //

res.status(200).send({oneIssue});
}
catch(error){
res.status(500).send({message:"Could not get issue",error});
}
}   

const updateIssueStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedIssue = await ReportIssue.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedIssue) {
      return res.status(404).send({ message: "Issue not found to update" });
    }

    // Notify the employee who reported the issue
    await sendNotification({
      recipients: [updatedIssue.reportedBy],
      type: "UPDATE_REPORT_ISSUE_STATUS",
      title: "Issue Status Updated",
      message: `Your issue status has been updated to: ${status}`,
      relatedId: updatedIssue._id,
      relatedModel: "ReportIssue"
    });

    res.status(200).send({ updatedIssue });
  } catch (error) {
    res.status(500).send({ message: "Cannot update issue", error });
  }
};


const deleteIssue = async (req, res) => {

const { id } = req.params;
try {
    const deleteIssue=await ReportIssue.findByIdAndDelete(id);
    if(!deleteIssue){
        return res.status(404).send({message:"Issue Not Found"});
    }
    res.status(200).send({message:"Succesfully deleted issue"})

} catch (error) {
    res.status(500).send({message:"Could not delete issue",error});
}


}      

export const IssuesControllers={createIssue,getAllIssues,getMyIssues,getOneIssue,updateIssueStatus,deleteIssue }