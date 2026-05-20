import express from 'express';
import * as sessionController from '../controllers/sessionController.js';
import verifyFirebaseToken from '../middleware/firebaseAuth.js';

const router = express.Router();

router.post('/', verifyFirebaseToken, sessionController.createSession);
router.get('/:sessionId', sessionController.getSessionById);
router.put('/:sessionId/end', verifyFirebaseToken, sessionController.endSession);

export default router;
