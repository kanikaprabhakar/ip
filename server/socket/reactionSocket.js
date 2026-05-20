export const setupReactionSocket = (io) => {
  io.on('connection', (socket) => {
    // Send a reaction (emoji)
    socket.on('reaction:send', (data) => {
      const { roomCode, emoji, userId, userName } = data;

      io.to(roomCode).emit('reaction:broadcast', {
        emoji,
        userId,
        userName,
        timestamp: Date.now()
      });
    });
  });
};

export default { setupReactionSocket };
