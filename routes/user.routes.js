import express from 'express'
import {userControllers} from '../controllers/user.contollers.js';
import { verifyToken } from '../middlewares/auth.js';
import { OnlyHR } from '../middlewares/roles.js';

const router=express.Router();

router.post('/register', userControllers.registerUser);
router.post('/verify-otp',userControllers.verifyOTP)
router.post('/login', userControllers.loginUser);
router.post('/logout', verifyToken, userControllers.logoutUser);
router.post('/requestPasswordReset',userControllers.requestPasswordReset);
router.post('/resetPassword', userControllers.resetPassword);
router.post('/resendOTP',userControllers.resendOTPToEmail);
router.get('/all', verifyToken,OnlyHR, userControllers.getUsers);


export default router
