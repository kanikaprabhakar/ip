import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  focusMinutes: { type: Number, default: 0 },
  goals: [{ text: String, completed: Boolean }],
  tasks: [{ text: String, completed: Boolean, createdAt: Date }],
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Session', SessionSchema);
