import express from 'express';
import { getWeeklyLeaderboard } from '../services/leaderboardService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const leaderboard = await getWeeklyLeaderboard();
  res.json({ leaderboard });
});

export default router;
