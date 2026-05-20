import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext.jsx';
import { useRoom } from '../../hooks/useSocket.js';
import PomodoroTimer from './PomodoroTimer.jsx';
import MemberList from './MemberList.jsx';
import TodoPanel from './TodoPanel.jsx';
import ReactionBar from './ReactionBar.jsx';
import StudyBuddy from '../AI/StudyBuddy.jsx';
import AmbientPlayer from '../Audio/AmbientPlayer.jsx';
import Leaderboard from '../Leaderboard/Leaderboard.jsx';
import * as api from '../../services/api.js';

const RoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { room, setRoom, joinRoom, leaveRoom, activeMembers } = useRoom();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState(['']);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const { data } = await api.getRoomByCode(code);
        setRoom(data.room);

        // Join the room via socket
        if (user) {
          joinRoom(code, user.uid, user.name, user.photoURL);

          // Create a session
          const sessionData = await api.createSession({
            roomId: data.room._id,
            goals: goals.filter(g => g.trim())
          });
          setSessionId(sessionData.data.session._id);
        }
      } catch (error) {
        console.error('Failed to load room:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeRoom();
    }
  }, [code, user]);

  const handleLeaveRoom = async () => {
    if (user && sessionId) {
      try {
        await api.endSession(sessionId, 0); // TODO: pass actual focus minutes
        leaveRoom(code, user.uid);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <p className="text-white/60">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary to-dark-tertiary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{room?.name}</h1>
            <p className="text-white/60 text-sm mt-1">Code: <span className="font-mono text-teal-accent">{code}</span></p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="px-6 py-2 bg-red-500/20 text-red-400 rounded-full font-semibold hover:bg-red-500/30 transition-all"
          >
            Leave Room
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Timer and Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <PomodoroTimer roomCode={code} />
            <TodoPanel roomCode={code} sessionId={sessionId} userId={user?.uid} />
          </div>

          {/* Right: Members and Leaderboard */}
          <div className="space-y-6">
            <MemberList activeMembers={activeMembers} />
            <Leaderboard />
          </div>
        </div>
      </div>

      {/* Floating Components */}
      <StudyBuddy />
      <AmbientPlayer />
      <ReactionBar roomCode={code} userId={user?.uid} userName={user?.name} />
    </div>
  );
};

export default RoomPage;
