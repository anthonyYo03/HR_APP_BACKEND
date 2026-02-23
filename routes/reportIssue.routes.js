import express from 'express'
import { IssuesControllers } from '../controllers/reportIssue.controllers.js';
import { verifyToken } from '../middlewares/auth.js';
import { OnlyHR } from '../middlewares/roles.js';
const router=express.Router();


router.post('/create',verifyToken,IssuesControllers.createIssue);//
router.get('/getAll',verifyToken,OnlyHR,IssuesControllers.getAllIssues);//
router.get('/getMyissues',verifyToken,IssuesControllers.getMyIssues);//
router.get('/getOne/:id',verifyToken,IssuesControllers.getOneIssue);
router.put('/edit/:id',verifyToken,OnlyHR,IssuesControllers.updateIssueStatus);
router.delete('/delete/:id',verifyToken,IssuesControllers.deleteIssue);//


export default router