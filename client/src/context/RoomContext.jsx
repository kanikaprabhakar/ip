import React, { createContext, useState, useEffect } from 'react';
import { createSocket } from '../services/socket.js';

export const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [timerState, setTimerState] = useState({ timeLeft: 1500, phase: 'focus', isRunning: false });
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const socketInstance = createSocket();
    setSocket(socketInstance);

    socketInstance.on('user:joined', (data) => {
      setActiveMembers(data.activeMembers);
    });

    socketInstance.on('user:left', (data) => {
      setActiveMembers(data.activeMembers);
    });

    socketInstance.on('timer:sync', (data) => {
      setTimerState(data);
    });

    socketInstance.on('task:updated', (data) => {
      if (data.action === 'added') {
        setTasks([...tasks, data.task]);
      } else if (data.action === 'toggled') {
        setTasks(tasks.map(t => t._id === data.task._id ? data.task : t));
      } else if (data.action === 'deleted') {
        setTasks(tasks.filter(t => t._id !== data.taskId));
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [tasks]);

  const joinRoom = (roomCode, userId, userName, userPhoto) => {
    if (socket) {
      socket.emit('join:room', { roomCode, userId, userName, userPhoto });
    }
  };

  const leaveRoom = (roomCode, userId) => {
    if (socket) {
      socket.emit('user:left', { roomCode, userId });
    }
  };

  const startTimer = (roomCode) => {
    if (socket) {
      socket.emit('timer:start', { roomCode });
    }
  };

  const pauseTimer = (roomCode) => {
    if (socket) {
      socket.emit('timer:pause', { roomCode });
    }
  };

  const addTask = (roomCode, sessionId, userId, taskText) => {
    if (socket) {
      socket.emit('task:add', { roomCode, sessionId, userId, taskText });
    }
  };

  const toggleTask = (roomCode, taskId) => {
    if (socket) {
      socket.emit('task:toggle', { roomCode, taskId });
    }
  };

  const deleteTask = (roomCode, taskId) => {
    if (socket) {
      socket.emit('task:delete', { roomCode, taskId });
    }
  };

  const sendReaction = (roomCode, emoji, userId, userName) => {
    if (socket) {
      socket.emit('reaction:send', { roomCode, emoji, userId, userName });
    }
  };

  return (
    <RoomContext.Provider
      value={{
        room,
        setRoom,
        socket,
        activeMembers,
        timerState,
        tasks,
        joinRoom,
        leaveRoom,
        startTimer,
        pauseTimer,
        addTask,
        toggleTask,
        deleteTask,
        sendReaction
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext;
