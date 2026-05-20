import { useContext, useEffect, useState } from 'react';
import RoomContext from '../context/RoomContext.jsx';
import AuthContext from '../context/AuthContext.jsx';

export const useSocket = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useSocket must be used within RoomProvider');
  }
  return context.socket;
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default { useSocket, useRoom, useAuth };
