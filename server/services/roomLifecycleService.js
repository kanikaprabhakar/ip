import Room from '../models/Room.js';
import Task from '../models/Task.js';

export const deleteRoomData = async (roomCode) => {
  await Task.deleteMany({ roomCode });
  await Room.deleteOne({ code: roomCode });
};

export const markRoomEmpty = async (roomCode) => {
  await Room.updateOne({ code: roomCode }, { $set: { emptySince: new Date() } });
};

export const clearRoomEmptyMark = async (roomCode) => {
  await Room.updateOne({ code: roomCode }, { $set: { emptySince: null } });
};

export const collectExpiredRooms = async (hours = 24) => {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const expiredRooms = await Room.find({ emptySince: { $ne: null, $lte: cutoff } }).select('code');

  for (const room of expiredRooms) {
    await deleteRoomData(room.code);
  }
};

export default { deleteRoomData, markRoomEmpty, clearRoomEmptyMark, collectExpiredRooms };