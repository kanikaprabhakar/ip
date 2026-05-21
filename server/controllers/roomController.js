import Room from '../models/Room.js';
import User from '../models/User.js';
import { deleteRoomData } from '../services/roomLifecycleService.js';

// Generate a unique 6-character alphanumeric room code
const generateRoomCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    exists = await Room.findOne({ code });
  }
  return code;
};

export const createRoom = async (req, res) => {
  try {
    const { name, subject, isPrivate } = req.body;
    const { uid } = req.user;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const code = await generateRoomCode();

    const room = new Room({
      code,
      name,
      subject,
      isPrivate,
      createdBy: user._id,
      members: [user._id]
    });

    await room.save();
    res.status(201).json({ room, code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { code } = req.params;
    const { uid } = req.user;

    const room = await Room.findOne({ code }).populate('members');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!room.members.find(m => m._id.toString() === user._id.toString())) {
      room.members.push(user._id);
      await room.save();
    }

    res.json({ room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoomByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code })
      .populate('members', 'name email photoURL uid')
      .populate('createdBy', 'name email photoURL uid');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false }).populate('createdBy', 'name photoURL').limit(20);
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const user = await User.findOne({ uid: req.user.uid });
    if (!user || room.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the room owner can delete the room' });
    }

    await deleteRoomData(code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { createRoom, joinRoom, getRoomByCode, listRooms, deleteRoom };
