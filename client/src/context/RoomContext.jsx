import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createSocket } from '../services/socket.js';

export const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [timerState, setTimerState] = useState({ timeLeft: 1500, phase: 'focus', isRunning: false });
  const [tasks, setTasks] = useState([]);
  const roomInfoRef = useRef({ roomCode: null, userId: null, userName: null, userPhoto: null });

  useEffect(() => {
    const socketInstance = createSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      const currentRoom = roomInfoRef.current;
      if (currentRoom.roomCode && currentRoom.userId) {
        socketInstance.emit('join:room', {
          roomCode: currentRoom.roomCode,
          userId: currentRoom.userId,
          userName: currentRoom.userName,
          userPhoto: currentRoom.userPhoto
        });
        socketInstance.emit('timer:sync-request', { roomCode: currentRoom.roomCode });
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message || err);
    });

    socketInstance.on('user:joined', (data) => {
      setActiveMembers(data.activeMembers || []);
    });

    socketInstance.on('user:left', (data) => {
      setActiveMembers(data.activeMembers || []);
    });

    socketInstance.on('user:kicked', (data) => {
      setActiveMembers(data.activeMembers || []);
    });

    socketInstance.on('timer:sync', (data) => {
      setTimerState(data);
    });

    socketInstance.on('task:updated', (data) => {
      if (data.action === 'added') {
        setTasks((prevTasks) => [...prevTasks, data.task]);
      } else if (data.action === 'toggled') {
        setTasks((prevTasks) => prevTasks.map((task) => (task._id === data.task._id ? data.task : task)));
      } else if (data.action === 'deleted') {
        setTasks((prevTasks) => prevTasks.filter((task) => task._id !== data.taskId));
      }
    });

    socketInstance.on('task:sync', (data) => {
      setTasks(data.tasks || []);
    });

    socketInstance.on('room:ended', () => {
      setRoom(null);
      setActiveMembers([]);
      setTasks([]);
      setTimerState({ timeLeft: 1500, phase: 'focus', isRunning: false });
    });

    return () => {
      socketInstance.off('connect');
      socketInstance.off('connect_error');
      socketInstance.off('user:joined');
      socketInstance.off('user:left');
      socketInstance.off('user:kicked');
      socketInstance.off('timer:sync');
      socketInstance.off('task:updated');
      socketInstance.off('task:sync');
      socketInstance.off('room:ended');
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomCode, userId, userName, userPhoto) => {
    roomInfoRef.current = { roomCode, userId, userName, userPhoto };

    if (socket) {
      socket.emit('join:room', { roomCode, userId, userName, userPhoto });
      socket.emit('timer:sync-request', { roomCode });
      socket.emit('task:sync-request', { roomCode });
    }
  }, [socket]);

  const leaveRoom = useCallback((roomCode, userId) => {
    if (socket) {
      socket.emit('user:left', { roomCode, userId });
    }
    roomInfoRef.current = { roomCode: null, userId: null, userName: null, userPhoto: null };
  }, [socket]);

  const startTimer = useCallback((roomCode) => {
    if (socket) {
      socket.emit('timer:start', { roomCode });
    }
  }, [socket]);

  const pauseTimer = useCallback((roomCode) => {
    if (socket) {
      socket.emit('timer:pause', { roomCode });
    }
  }, [socket]);

  const addTask = useCallback((roomCode, sessionId, userId, taskText) => {
    if (socket) {
      socket.emit('task:add', { roomCode, sessionId, userId, taskText });
    }
  }, [socket]);

  const toggleTask = useCallback((roomCode, taskId) => {
    if (socket) {
      socket.emit('task:toggle', { roomCode, taskId });
    }
  }, [socket]);

  const deleteTask = useCallback((roomCode, taskId) => {
    if (socket) {
      socket.emit('task:delete', { roomCode, taskId });
    }
  }, [socket]);

  const sendReaction = useCallback((roomCode, emoji, userId, userName) => {
    if (socket) {
      socket.emit('reaction:send', { roomCode, emoji, userId, userName });
    }
  }, [socket]);

  const kickMember = useCallback((roomCode, requesterId, targetUserId) => {
    if (socket) {
      socket.emit('room:member:kick', { roomCode, requesterUid: requesterId, targetUserId });
    }
  }, [socket]);

  const contextValue = useMemo(
    () => ({
      room,
      setRoom,
      socket,
      activeMembers,
      timerState,
      tasks,
      setTasks,
      joinRoom,
      leaveRoom,
      startTimer,
      pauseTimer,
      addTask,
      toggleTask,
      deleteTask,
      sendReaction,
      kickMember
    }),
    [room, socket, activeMembers, timerState, tasks, joinRoom, leaveRoom, startTimer, pauseTimer, addTask, toggleTask, deleteTask, sendReaction, kickMember]
  );

  return <RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>;
};

export default RoomContext;
