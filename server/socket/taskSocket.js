import Session from '../models/Session.js';
import Task from '../models/Task.js';

export const setupTaskSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('task:sync-request', async (data) => {
      const { roomCode } = data;

      try {
        const tasks = await Task.find({ roomCode }).sort({ createdAt: 1 });
        socket.emit('task:sync', {
          roomCode,
          tasks: tasks.map((task) => ({
            _id: task._id,
            text: task.text,
            completed: task.completed,
            roomCode: task.roomCode,
            userId: task.userId
          }))
        });
      } catch (error) {
        console.error('Error syncing tasks:', error);
      }
    });

    // Add a task
    socket.on('task:add', async (data) => {
      const { roomCode, sessionId, taskText } = data;
      const userId = socket.data.userId || data.userId;

      try {
        const task = new Task({
          roomCode,
          sessionId,
          userId,
          text: taskText
        });

        await task.save();

        io.to(roomCode).emit('task:updated', {
          action: 'added',
          task: { _id: task._id, text: task.text, completed: task.completed, userId: task.userId }
        });
      } catch (error) {
        console.error('Error adding task:', error);
      }
    });

    // Toggle task completion
    socket.on('task:toggle', async (data) => {
      const { roomCode, taskId } = data;

      try {
        const task = await Task.findById(taskId);
        if (!task) {
          return;
        }

        task.completed = !task.completed;
        await task.save();

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
