import express from 'express'
const router=express.Router();
import { verifyToken } from '../middlewares/auth.js';
import { OnlyHR } from '../middlewares/roles.js';
import { requestControllers } from '../controllers/request.controllers.js';


router.post('/create',verifyToken,requestControllers.createRequest);
router.get('/getAll',verifyToken,OnlyHR,requestControllers.getAllRequests);
router.get('/getmine',verifyToken,requestControllers.getMyRequests);
router.get('/getOne/:id',verifyToken,requestControllers.getOneRequest);
router.put('/editmine/:id',verifyToken,requestControllers.editMyRequest);
router.put('/hredit/:id',verifyToken,OnlyHR,requestControllers.hrRequestUpdate);
router.delete('/delete/:id',verifyToken,requestControllers.deleteRequest);
export default router;
