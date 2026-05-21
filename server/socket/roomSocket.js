import Room from '../models/Room.js';
import User from '../models/User.js';
import { clearRoomEmptyMark, deleteRoomData, markRoomEmpty } from '../services/roomLifecycleService.js';

export const setupRoomSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('join:room', async (data) => {
      const { roomCode, userId: providedUserId, userName, userPhoto } = data;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      // Prefer server-verified userId (from token) when available
      const userId = socket.data.userId || providedUserId;
      socket.data.userId = userId;

      try {
        const room = await Room.findOne({ code: roomCode });
        if (room) {
          await clearRoomEmptyMark(roomCode);

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

          if (room.activeMembers.length === 0) {
            await markRoomEmpty(roomCode);
          }

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

    socket.on('room:member:kick', async (data) => {
      const { roomCode, targetUserId } = data;
      const requesterUid = socket.data.userId || data.requesterUid;

      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          return;
        }

        const requester = await User.findOne({ uid: requesterUid });
        if (!requester || room.createdBy.toString() !== requester._id.toString()) {
          return;
        }

        if (requesterUid === targetUserId) {
          return;
        }

        room.activeMembers = room.activeMembers.filter((member) => member.userId !== targetUserId);
        room.members = room.members.filter((memberId) => memberId.toString() !== targetUserId);
        await room.save();

        if (room.activeMembers.length === 0) {
          await markRoomEmpty(roomCode);
        }

        io.to(roomCode).emit('user:kicked', {
          targetUserId,
          activeMembers: room.activeMembers
        });

        const targetSocket = [...io.sockets.sockets.values()].find((connectedSocket) => connectedSocket.data.userId === targetUserId);
        if (targetSocket) {
          targetSocket.leave(roomCode);
        }
      } catch (error) {
        console.error('Error kicking member:', error);
      }
    });

    socket.on('room:end', async (data) => {
      const { roomCode } = data;
      const requesterUid = socket.data.userId || data.requesterUid;

      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          return;
        }

        const requester = await User.findOne({ uid: requesterUid });
        if (!requester || room.createdBy.toString() !== requester._id.toString()) {
          return;
        }

        io.to(roomCode).emit('room:ended', { roomCode });
        await deleteRoomData(roomCode);
      } catch (error) {
        console.error('Error ending room:', error);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      const roomCode = socket.data.roomCode;
      const userId = socket.data.userId;

      if (roomCode && userId) {
        try {
          const room = await Room.findOne({ code: roomCode });
          if (room) {
            room.activeMembers = room.activeMembers.filter((member) => member.userId !== userId);
            await room.save();

            if (room.activeMembers.length === 0) {
              await markRoomEmpty(roomCode);
            }

            io.to(roomCode).emit('user:left', {
              userId,
              activeMembers: room.activeMembers
            });
          }
        } catch (error) {
          console.error('Error during disconnect cleanup:', error);
        }
      }
    });
  });
};

export default { setupRoomSocket };
