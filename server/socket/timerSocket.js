import { getTimerState, startTimer, pauseTimer, getOrInitializeTimer } from '../services/timerService.js';

export const setupTimerSocket = (io) => {
  io.on('connection', (socket) => {
    // Start timer in a room
    socket.on('timer:start', (data) => {
      const { roomCode } = data;
      startTimer(roomCode);
      const state = getTimerState(roomCode);

      io.to(roomCode).emit('timer:started', state);
    });

    // Pause timer
    socket.on('timer:pause', (data) => {
      const { roomCode } = data;
      pauseTimer(roomCode);
      const state = getTimerState(roomCode);

      io.to(roomCode).emit('timer:paused', state);
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

      // Emit every second
      const interval = setInterval(() => {
        if (io.sockets.adapter.rooms.get(roomCode)?.size > 0) {
          const state = getTimerState(roomCode);
          io.to(roomCode).emit('timer:sync', state);
        } else {
          clearInterval(interval);
        }
      }, 1000);

      socket.on('disconnect', () => {
        clearInterval(interval);
      });
    });
  });
};

export default { setupTimerSocket };
