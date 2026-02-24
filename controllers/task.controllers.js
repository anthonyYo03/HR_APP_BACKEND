import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { getAllHRIds,sendNotification } from "../services/notification.service.js";
// "NEW_TASK","UPDATE_TASK","UPDATE_TASK_STATUS"
const createTask = async (req, res) => {
  const { name, description, dueDate, priority, assignedTo } = req.body;
  const id = req.userId;

  try {
    const newTask = await Task.create({ createdBy: id, name, description, dueDate, priority, assignedTo });

    // Notify the assigned employee
    await sendNotification({
      recipients: [newTask.assignedTo],
      type: "NEW_TASK",
      title: "New Task Assigned",
      message: `HR has assigned you a new task: ${name}`,
      relatedId: newTask._id,
      relatedModel: "Task"
    });

    res.status(201).send({ message: "Task created successfully" });
  } catch (error) {
    res.status(500).send({ message: `Cannot create task ${error}` });
  }
};


const getAllTasks=async(req,res)=>{

    try {
const allTasks=await Task.find({}).sort({ createdAt: -1 });
if(allTasks.length===0){
    return res.status(200).send({message:"Task not found"})
}
res.status(200).send({allTasks});
    } catch (error) {
        return res.status(500).send({message:`Cannot get tasks ${error}`})
    }
}


const getOneTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).send({ message: "Task not found" });

    // 
    const user = await User.findById(req.userId);
    const isHR = user.role === "HR";
    const isAssigned = task.assignedTo.toString() === req.userId;
    if (!isHR && !isAssigned) {
      return res.status(403).send({ message: "Access Denied!" });
    }
    //

    res.status(200).send({ oneTask: task });
  } catch (error) {
    res.status(500).send(`Cannot get task ${error}`);
  }
};


const getMyTasks=async(req,res)=>{

const id=req.userId;

try{
const myTasks=await Task.find({assignedTo:id}).sort({ createdAt: -1 })



if(myTasks.length===0){
    return res.status(200).send({myTasks});
}

res.status(200).send({myTasks});
    
} 
catch (error) {
    res.status(500).send(`Cannot get task ${error}`);
}

}


const HrTaskUpdate=async(req,res)=>{
const {name,description,dueDate,status,priority,assignedTo}=req.body;
const {id}=req.params;
try {
    const task=await Task.findByIdAndUpdate(id,{name,description,dueDate,status,priority,assignedTo},{new:true})
    if(!task) return res.status(404).send({ message: "Task not found" })

 // Notify the assigned employee
    await sendNotification({
      recipients: [task.assignedTo],
      type: "UPDATE_TASK",
      title: "Task Updated",
      message: `HR has updated your assigned task: ${name}`,
      relatedId: task._id,
      relatedModel: "Task"
    });

    res.status(200).send({message:"Task updated successfully"})
} catch (error) {
       res.status(500).send(`Cannot get task ${error}`);
}


}


const employeeUpdateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).send({ message: "Task not found" });
    
    task.status = status;
    await task.save();

    const hrIds = await getAllHRIds();
    await sendNotification({
      recipients: hrIds,
      type: "UPDATE_TASK_STATUS",
      title: "Task Status Updated",
      message: `Task status has been updated to: ${status}`,
      relatedId: task._id,
      relatedModel: "Task"
    });

    res.status(200).send({ message: "Task updated successfully" });
  } catch (error) {
    res.status(500).send(`Cannot update task ${error}`);
  }
};


const deleteTask=async(req,res)=>{
const {id}=req.params;

try {
    await Task.findByIdAndDelete(id)
    res.status(200).send({message:"Task deleted successfully"})
} catch (error) {
       res.status(500).send(`Cannot delete task ${error}`);
}



}

export const taskControllers={
createTask,getAllTasks,getOneTask,
getMyTasks,HrTaskUpdate,
employeeUpdateTaskStatus,deleteTask
}
