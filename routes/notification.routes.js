import express from 'express'
import { NotificationControllers } from '../controllers/notification.controllers.js';
import { verifyToken } from '../middlewares/auth.js';
const router=express.Router();

router.get('/get',verifyToken,NotificationControllers.getNotification);
router.get('/getNumber',verifyToken,NotificationControllers.notificationCounter);
router.put('/markAsRead/:id',verifyToken,NotificationControllers.markAsRead);
router.put('/clear',verifyToken,NotificationControllers.clearNotifications);

export default router
