import Session from '../models/Session.js';
import User from '../models/User.js';

export const createSession = async (req, res) => {
  try {
    const { roomId, goals } = req.body;
    const { uid } = req.user;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const session = new Session({
      roomId,
      userId: user._id,
      goals: goals?.map(g => ({ text: g, completed: false })) || [],
      focusMinutes: 0
    });

    await session.save();
    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { focusMinutes } = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { endedAt: new Date(), focusMinutes },
      { new: true }
    );

    if (session && focusMinutes > 0) {
      const user = await User.findById(session.userId);
      user.focusMinutesThisWeek += focusMinutes;
      await user.save();
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).populate('userId', 'name photoURL');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { createSession, endSession, getSessionById };
