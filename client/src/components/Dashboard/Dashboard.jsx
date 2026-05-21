import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('create');
  const [roomName, setRoomName] = useState('');
  const [subject, setSubject] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [rooms, setRooms] = useState([]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.createRoom({ name: roomName, subject, isPrivate });
      navigate(`/room/${data.code}`);
    } catch (error) {
      console.error('Room creation failed:', error);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (joinCode.length === 6) {
      try {
        await api.joinRoom(joinCode);
        navigate(`/room/${joinCode}`);
      } catch (error) {
        console.error('Join failed:', error);
      }
    }
  };

  const handleBrowseRooms = async () => {
    try {
      const { data } = await api.listRooms();
      setRooms(data.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  React.useEffect(() => {
    if (tab === 'browse') {
      handleBrowseRooms();
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary to-dark-tertiary p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-bold text-white">StudyRoom</h1>
          <div className="flex items-center gap-4">
            <img
              src={user?.photoURL || 'https://via.placeholder.com/80'}
              alt={user?.name || 'Profile'}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
              onError={(event) => {
                event.currentTarget.src = 'https://via.placeholder.com/80';
              }}
            />
            <span className="text-white/80">{user?.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 px-6 py-4 transition-colors ${
                tab === 'create'
                  ? 'bg-purple-accent/20 text-purple-accent border-b-2 border-purple-accent'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 px-6 py-4 transition-colors ${
                tab === 'join'
                  ? 'bg-purple-accent/20 text-purple-accent border-b-2 border-purple-accent'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => setTab('browse')}
              className={`flex-1 px-6 py-4 transition-colors ${
                tab === 'browse'
                  ? 'bg-purple-accent/20 text-purple-accent border-b-2 border-purple-accent'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Browse
            </button>
          </div>

          <div className="p-8">
            {tab === 'create' && (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-accent outline-none transition"
                    placeholder="e.g., Math Study Session"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-accent outline-none transition"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <label className="flex items-center gap-2 text-white/80">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  Private Room
                </label>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-accent to-teal-accent text-white font-semibold py-3 rounded-full hover:shadow-lg transition-all"
                >
                  Create Room
                </button>
              </form>
            )}

            {tab === 'join' && (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Room Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength="6"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-center text-2xl font-mono focus:border-teal-accent outline-none transition"
                    placeholder="ABCDEF"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-accent to-purple-accent text-white font-semibold py-3 rounded-full hover:shadow-lg transition-all"
                >
                  Join Room
                </button>
              </form>
            )}

            {tab === 'browse' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => navigate(`/room/${room.code}`)}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-purple-accent/50 cursor-pointer transition"
                    >
                      <h3 className="text-white font-semibold mb-1">{room.name}</h3>
                      <p className="text-white/60 text-sm mb-2">{room.subject}</p>
                      <p className="text-teal-accent text-sm font-mono">{room.code}</p>
                    </div>
                  ))
                ) : (
                  <p className="col-span-2 text-white/60">No public rooms available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
