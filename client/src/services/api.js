import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to request headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('firebaseToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
export const getUserProfile = () => apiClient.get('/auth/profile');

// Room endpoints
export const createRoom = (roomData) => apiClient.post('/rooms', roomData);
export const joinRoom = (code) => apiClient.post(`/rooms/join/${code}`);
export const getRoomByCode = (code) => apiClient.get(`/rooms/code/${code}`);
export const listRooms = () => apiClient.get('/rooms');
export const deleteRoom = (code) => apiClient.delete(`/rooms/${code}`);

// Session endpoints
export const createSession = (sessionData) => apiClient.post('/sessions', sessionData);
export const endSession = (sessionId, focusMinutes) =>
  apiClient.put(`/sessions/${sessionId}/end`, { focusMinutes });
export const getSession = (sessionId) => apiClient.get(`/sessions/${sessionId}`);

// Leaderboard endpoints
export const getLeaderboard = () => apiClient.get('/leaderboard');

// AI endpoints
export const chatWithAI = (message) => apiClient.post('/ai/chat', { message });

// Freesound search (server proxies with server-side API key)
export const searchFreesound = (q, page_size = 10) => apiClient.get(`/audio/freesound/search?q=${encodeURIComponent(q)}&page_size=${page_size}`);

export default apiClient;
