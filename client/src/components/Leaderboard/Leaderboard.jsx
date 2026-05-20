import React, { useEffect, useState } from 'react';
import * as api from '../../services/api.js';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.getLeaderboard();
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4">Weekly Leaderboard 🏆</h3>
      <div className="space-y-2">
        {leaderboard.slice(0, 10).map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-white/60 font-semibold w-6"># {entry.rank}</span>
              <img
                src={entry.photoURL || 'https://via.placeholder.com/32'}
                alt={entry.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-white/80 text-sm">{entry.name}</span>
            </div>
            <span className="text-teal-accent font-semibold text-sm">
              {entry.focusMinutes} min
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
