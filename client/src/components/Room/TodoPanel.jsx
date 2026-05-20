import React, { useState } from 'react';
import { useRoom } from '../../hooks/useSocket.js';

const TodoPanel = ({ roomCode, sessionId, userId }) => {
  const { tasks, addTask, toggleTask, deleteTask } = useRoom();
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(roomCode, sessionId, userId, newTask);
      setNewTask('');
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4">Today's Tasks</h3>

      <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-accent outline-none transition"
          placeholder="Add a task..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-teal-accent text-dark-bg rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          +
        </button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(roomCode, task._id)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className={`flex-1 text-sm ${task.completed ? 'line-through text-white/40' : 'text-white/80'}`}>
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(roomCode, task._id)}
                className="text-white/40 hover:text-red-400 transition"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p className="text-white/40 text-sm">No tasks yet</p>
        )}
      </div>
    </div>
  );
};

export default TodoPanel;
