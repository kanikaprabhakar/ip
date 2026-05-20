import User from '../models/User.js';

export const createOrUpdateUser = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body;

    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({ uid, email, name, photoURL });
    } else {
      user.name = name || user.name;
      user.photoURL = photoURL || user.photoURL;
      user.email = email || user.email;
    }

    await user.save();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { createOrUpdateUser, getUserProfile };
