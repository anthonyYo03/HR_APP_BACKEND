import express from 'express'
import { taskControllers } from '../controllers/task.controllers.js';
import { verifyToken } from '../middlewares/auth.js';
import { OnlyHR } from '../middlewares/roles.js';


const router=express.Router();

router.post('/create',verifyToken,OnlyHR,taskControllers.createTask);
router.get('/getAll',verifyToken,OnlyHR,taskControllers.getAllTasks);
router.get('/getOne/:id',verifyToken,taskControllers.getOneTask);
router.get('/getmine',verifyToken,taskControllers.getMyTasks);
router.put('/hrUpdate/:id',verifyToken,OnlyHR,taskControllers.HrTaskUpdate);
router.put('/employeeUpdate/:id',verifyToken,taskControllers.employeeUpdateTaskStatus);
router.delete('/delete/:id',verifyToken,OnlyHR,taskControllers.deleteTask);

export default router;