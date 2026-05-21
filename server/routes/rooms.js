import express from 'express';
import * as roomController from '../controllers/roomController.js';
import verifyFirebaseToken from '../middleware/firebaseAuth.js';

const router = express.Router();

router.post('/', verifyFirebaseToken, roomController.createRoom);
router.get('/code/:code', roomController.getRoomByCode);
router.post('/join/:code', verifyFirebaseToken, roomController.joinRoom);
router.delete('/:code', verifyFirebaseToken, roomController.deleteRoom);
router.get('/', roomController.listRooms);

export default router;
