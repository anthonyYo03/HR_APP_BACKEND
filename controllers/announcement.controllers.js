import Announcement from "../models/announcement.model.js";
import { sendNotification,getAllEmployeeIds } from "../services/notification.service.js";


const createAnnouncement=async(req,res)=>{
const userId=req.userId;
const {title,description}=req.body
try{
const announcement=await Announcement.create({title,description,createdBy:userId});


// Notification Creation
const employeeIds = await getAllEmployeeIds();
await sendNotification({
  recipients: employeeIds,
  type: "CREATE_ANNOUNCEMENT",
  title: "New Announcement",
  message: `HR posted a new announcement: ${title}`,
  relatedId: announcement._id,
  relatedModel: "Announcement"

})
//
res.status(201).send({message:"Announcement created Succcesfully"})
}
catch(error){
res.status(500).send({message:`Cannot create Announcement:${error}`})
}

}


const getAllAnnouncement=async(req,res)=>{

try {
    const announcements=await Announcement.find({});
if(announcements.length===0){
     return res.status(200).send({ message: "No announcements found" });
 } 

res.status(200).send({announcements});


} catch (error) {
    res.status(500).send({message:"Announcements not found:",error})
}

}


const getOneAnnouncement=async(req,res)=>{
    const {id}=req.params;
try {
    const announcement=await Announcement.findById(id);
if(!announcement){
   return res.status(404).send({message:"Announcements not found"})
 } 

res.status(200).send(announcement);


} catch (error) {
    res.status(500).send({message:"Announcements not found:",error})
}

}
const editAnnouncement = async (req, res) => {
  const { id } = req.params; 
  const { title, description } = req.body;
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      id, 
      { title, description }, 
      { new: true }
    );
    if (!announcement) {
      return res.status(404).send({ message: "Announcement not found" });
    }

// Notification Creation
const employeeIds = await getAllEmployeeIds();
await sendNotification({
  recipients: employeeIds,
  type: "UPDATE_ANNOUNCEMENT",
  title: "Announcement Updated",
  message: `HR updated an announcement: ${title}`,
  relatedId: announcement._id,
  relatedModel: "Announcement"

})
//

res.status(200).send({ message: "Announcement updated successfully", announcement });
  } catch (error) {
    res.status(500).send({ message: "Cannot update announcement", error });
  }
};


const deleteAnnouncement=async(req,res)=>{
const { id } = req.params;
try {
   const deleteAnnouncement=await Announcement.findByIdAndDelete(id);
    if(!deleteAnnouncement){
    return res.status(404).send({message:"Announcements not found"})
 } 
res.status(200).send({message:"Announcement deleted Succcesfully"})

    
} catch (error) {
    res.status(500).send({message:"Cannot delete announcements",error})
}


}


export const announcementControllers={
createAnnouncement,getAllAnnouncement,getOneAnnouncement,
editAnnouncement,deleteAnnouncement
}