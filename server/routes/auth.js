import express from 'express';
import * as authController from '../controllers/userController.js';
import verifyFirebaseToken from '../middleware/firebaseAuth.js';

const router = express.Router();

router.post('/register', authController.createOrUpdateUser);
router.get('/profile', verifyFirebaseToken, authController.getUserProfile);

export default router;
