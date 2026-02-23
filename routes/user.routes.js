import express from 'express'
import {userControllers} from '../controllers/user.contollers.js';
import { verifyToken } from '../middlewares/auth.js';
const router=express.Router();

router.post('/register', userControllers.registerUser);
router.post('/verify-otp',userControllers.verifyOTP)
router.post('/login', userControllers.loginUser);
router.post('/logout', verifyToken, userControllers.logoutUser);
router.post('/requestPasswordReset',userControllers.requestPasswordReset);
router.post('/resetPassword', userControllers.resetPassword);
router.post('/resendOTP',userControllers.resendOTPToEmail);
router.get('/', verifyToken, userControllers.getUsers);


export default router
