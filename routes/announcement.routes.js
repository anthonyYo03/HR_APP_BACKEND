import express from 'express'
import { announcementControllers } from '../controllers/announcement.controllers.js';
import { verifyToken } from '../middlewares/auth.js';
import { OnlyHR } from '../middlewares/roles.js';
const router=express.Router();

router.post('/create',verifyToken,OnlyHR,announcementControllers.createAnnouncement);
router.get('/getAll',verifyToken,announcementControllers.getAllAnnouncement)
router.get('/getOne/:id',verifyToken,announcementControllers.getOneAnnouncement);
router.put('/edit/:id',verifyToken,OnlyHR,announcementControllers.editAnnouncement);
router.delete('/delete/:id',verifyToken,OnlyHR,announcementControllers.deleteAnnouncement);


export default router