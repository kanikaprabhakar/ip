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
  const { user, dbUser, logout } = useContext(AuthContext);
  const { room, setRoom, joinRoom, leaveRoom, activeMembers, kickMember, setTasks, timerState, socket } = useRoom();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const { data } = await api.getRoomByCode(code);
        setRoom(data.room);

        // Join the room via socket
        if (user) {
          joinRoom(code, user.uid, user.name, user.photoURL);

          // Create a session
          const sessionData = await api.createSession({ roomId: data.room._id, goals: [] });
          setSessionId(sessionData.data.session._id);

          setTasks([]);
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
  }, [code, user, joinRoom, navigate, setRoom, setTasks]);

  useEffect(() => {
    if (!socket || !user) {
      return;
    }

    const handleRoomEnded = async ({ roomCode }) => {
      if (roomCode !== code) {
        return;
      }

      try {
        if (sessionId) {
          await api.endSession(sessionId, timerState.focusMinutesThisSession || 0);
        }
      } catch (error) {
        console.error('Failed to finalize session after room end:', error);
      } finally {
        navigate('/dashboard');
      }
    };

    const handleUserKicked = async ({ targetUserId }) => {
      if (targetUserId !== user.uid) {
        return;
      }

      try {
        if (sessionId) {
          await api.endSession(sessionId, timerState.focusMinutesThisSession || 0);
        }
      } catch (error) {
        console.error('Failed to finalize session after kick:', error);
      } finally {
        navigate('/dashboard');
      }
    };

    socket.on('room:ended', handleRoomEnded);
    socket.on('user:kicked', handleUserKicked);

    return () => {
      socket.off('room:ended', handleRoomEnded);
      socket.off('user:kicked', handleUserKicked);
    };
  }, [code, navigate, sessionId, socket, timerState.focusMinutesThisSession, user]);

  const handleLeaveRoom = async () => {
    if (user && sessionId) {
      try {
        await api.endSession(sessionId, timerState.focusMinutesThisSession || 0);
        leaveRoom(code, user.uid);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
  };

  const handleEndRoom = async () => {
    if (!room?._id) {
      return;
    }

    try {
      setIsEnding(true);
      if (socket) {
        socket.emit('room:end', { roomCode: code, requesterUid: user.uid });
      } else {
        await api.deleteRoom(code);
      }
      if (sessionId) {
        await api.endSession(sessionId, timerState.focusMinutesThisSession || 0);
      }
      await logout();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to end room:', error);
    } finally {
      setIsEnding(false);
    }
  };

  const handleLeaveKeepRunning = async () => {
    setShowLeaveOptions(false);
    await handleLeaveRoom();
  };

  const handleEndForEveryone = async () => {
    setShowLeaveOptions(false);
    await handleEndRoom();
  };


  const handleKickMember = async (targetUserId) => {
    if (room && user?.uid) {
      kickMember(code, user.uid, targetUserId);
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
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {room?.createdBy && user?.uid && String(room.createdBy?.uid || '') === String(user.uid) && (
              <button
                onClick={() => setShowLeaveOptions(true)}
                disabled={isEnding}
                className="px-6 py-2 bg-red-500/20 text-red-300 rounded-full font-semibold hover:bg-red-500/30 transition-all disabled:opacity-60"
              >
                {isEnding ? 'Working...' : 'Leave Options'}
              </button>
            )}
            <button
              onClick={() => {
                if (room?.createdBy && user?.uid && String(room.createdBy?.uid || '') === String(user.uid)) {
                  setShowLeaveOptions(true);
                  return;
                }

                handleLeaveRoom();
              }}
              className="px-6 py-2 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-all"
            >
              Leave Room
            </button>
          </div>
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
            <MemberList
              activeMembers={activeMembers}
              currentUserId={user?.uid}
              canManageMembers={String(room?.createdBy?.uid || '') === String(user?.uid || '')}
              onKickMember={handleKickMember}
            />
            <Leaderboard />
          </div>
        </div>
      </div>

      {showLeaveOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-secondary p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-2">Leave room?</h2>
            <p className="text-white/60 text-sm mb-6">You can leave and keep the room running, or end it for everyone.</p>
            <div className="grid gap-3">
              <button onClick={handleLeaveKeepRunning} className="w-full rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20 transition-all">
                Leave and keep running
              </button>
              <button onClick={handleEndForEveryone} className="w-full rounded-full bg-red-500/20 px-4 py-3 text-red-200 hover:bg-red-500/30 transition-all">
                End for everyone
              </button>
              <button onClick={() => setShowLeaveOptions(false)} className="w-full rounded-full bg-transparent px-4 py-3 text-white/60 hover:text-white transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Components */}
      <StudyBuddy />
      <AmbientPlayer />
      <ReactionBar roomCode={code} userId={user?.uid} userName={user?.name} />
    </div>
  );
};

export default RoomPage;
