import Room from '../models/Room.js';
import User from '../models/User.js';

export const setupRoomSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('join:room', async (data) => {
      const { roomCode, userId, userName, userPhoto } = data;
      socket.join(roomCode);

      try {
        const room = await Room.findOne({ code: roomCode });
        if (room) {
          const activeMember = {
            userId,
            userName,
            userPhoto,
            currentTask: '',
            joinedAt: new Date()
          };

          if (!room.activeMembers.find(m => m.userId === userId)) {
            room.activeMembers.push(activeMember);
            await room.save();
          }

          io.to(roomCode).emit('user:joined', {
            userId,
            userName,
            userPhoto,
            activeMembers: room.activeMembers
          });
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });

    // User leaves a room
    socket.on('user:left', async (data) => {
      const { roomCode, userId } = data;

      try {
        const room = await Room.findOne({ code: roomCode });
        if (room) {
          room.activeMembers = room.activeMembers.filter(m => m.userId !== userId);
          await room.save();

          io.to(roomCode).emit('user:left', {
            userId,
            activeMembers: room.activeMembers
          });
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }

      socket.leave(roomCode);
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      // Cleanup will be handled by the client sending user:left
    });
  });
};

export default { setupRoomSocket };
