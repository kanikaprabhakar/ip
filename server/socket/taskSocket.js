import Session from '../models/Session.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

export const setupTaskSocket = (io) => {
  io.on('connection', (socket) => {
    // Add a task
    socket.on('task:add', async (data) => {
      const { roomCode, sessionId, userId, taskText } = data;

      try {
        const task = new Task({
          sessionId,
          userId,
          text: taskText
        });

        await task.save();

        io.to(roomCode).emit('task:updated', {
          action: 'added',
          task: { _id: task._id, text: task.text, completed: task.completed }
        });
      } catch (error) {
        console.error('Error adding task:', error);
      }
    });

    // Toggle task completion
    socket.on('task:toggle', async (data) => {
      const { roomCode, taskId } = data;

      try {
        const task = await Task.findByIdAndUpdate(
          taskId,
          { completed: true },
          { new: true }
        );

        io.to(roomCode).emit('task:updated', {
          action: 'toggled',
          task: { _id: task._id, text: task.text, completed: task.completed }
        });
      } catch (error) {
        console.error('Error toggling task:', error);
      }
    });

    // Delete task
    socket.on('task:delete', async (data) => {
      const { roomCode, taskId } = data;

      try {
        await Task.findByIdAndDelete(taskId);

        io.to(roomCode).emit('task:updated', {
          action: 'deleted',
          taskId
        });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    });
  });
};

export default { setupTaskSocket };
