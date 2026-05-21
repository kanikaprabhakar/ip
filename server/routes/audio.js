import express from 'express';
import { searchFreesound } from '../controllers/audioController.js';

const router = express.Router();

// GET /api/audio/freesound/search?q=ambient
router.get('/freesound/search', searchFreesound);

export default router;
