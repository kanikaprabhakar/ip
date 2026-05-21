import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import sessionRoutes from './routes/sessions.js';
import leaderboardRoutes from './routes/leaderboard.js';
import aiRoutes from './routes/ai.js';
import audioRoutes from './routes/audio.js';

// Import socket handlers
import { setupRoomSocket } from './socket/roomSocket.js';
import { setupTimerSocket } from './socket/timerSocket.js';
import { setupTaskSocket } from './socket/taskSocket.js';
import { setupReactionSocket } from './socket/reactionSocket.js';
import { collectExpiredRooms } from './services/roomLifecycleService.js';

// Initialize Firebase Admin
const firebaseConfig = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL
};

if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({ credential: admin.credential.cert(firebaseConfig) });
}

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket auth: verify Firebase ID token on connection (if configured)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // no token provided; allow anonymous connection but without user data
      return next();
    }

    if (!admin.apps || admin.apps.length === 0) {
      console.error('Socket auth: Firebase Admin not initialized');
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    socket.data.userId = decoded.uid;
    socket.data.userEmail = decoded.email;
    return next();
  } catch (err) {
    console.error('Socket auth error:', err);
    return next(new Error('Unauthorized'));
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studyroom')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audio', audioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Setup Socket.io handlers
setupRoomSocket(io);
setupTimerSocket(io);
setupTaskSocket(io);
setupReactionSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Empty-room cleanup: delete rooms that have stayed empty for 24 hours
setInterval(async () => {
  try {
    await collectExpiredRooms(24);
  } catch (error) {
    console.error('Room cleanup error:', error);
  }
}, 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`StudyRoom server running on port ${PORT}`);
});

export default app;
