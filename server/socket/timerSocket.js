import { getTimerState, startTimer, pauseTimer, getOrInitializeTimer } from '../services/timerService.js';

const roomIntervals = new Map();

export const setupTimerSocket = (io) => {
  io.on('connection', (socket) => {
    // Start timer in a room
    socket.on('timer:start', (data) => {
      const { roomCode } = data;
      startTimer(roomCode);
      io.to(roomCode).emit('timer:sync', getTimerState(roomCode));
    });

    // Pause timer
    socket.on('timer:pause', (data) => {
      const { roomCode } = data;
      pauseTimer(roomCode);
      io.to(roomCode).emit('timer:sync', getTimerState(roomCode));
    });

    // Sync timer state (client requesting current state)
    socket.on('timer:sync-request', (data) => {
      const { roomCode } = data;
      const state = getOrInitializeTimer(roomCode);
      socket.emit('timer:sync', state);
    });

    // Server broadcasts timer state every second to all in room
    socket.on('join:room', (data) => {
      const { roomCode } = data;
      const state = getOrInitializeTimer(roomCode);
      socket.emit('timer:sync', state);

      if (!roomIntervals.has(roomCode)) {
        const interval = setInterval(() => {
          if (io.sockets.adapter.rooms.get(roomCode)?.size > 0) {
            io.to(roomCode).emit('timer:sync', getTimerState(roomCode));
          } else {
            clearInterval(interval);
            roomIntervals.delete(roomCode);
          }
        }, 1000);

        roomIntervals.set(roomCode, interval);
      }
    });
  });
};

export default { setupTimerSocket };
