import User from '../models/User.js';

export const getWeeklyLeaderboard = async () => {
  try {
    const leaderboard = await User.find()
      .select('name photoURL focusMinutesThisWeek')
      .sort({ focusMinutesThisWeek: -1 })
      .limit(50);

    return leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      photoURL: user.photoURL,
      focusMinutes: user.focusMinutesThisWeek
    }));
  } catch (error) {
    console.error('Leaderboard error:', error);
    return [];
  }
};

export const resetWeeklyStats = async () => {
  try {
    await User.updateMany({}, { focusMinutesThisWeek: 0, weekStartDate: new Date() });
  } catch (error) {
    console.error('Reset stats error:', error);
  }
};

export default { getWeeklyLeaderboard, resetWeeklyStats };
