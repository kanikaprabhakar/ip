import React, { useEffect, useState } from 'react';
import { useRoom } from '../../hooks/useSocket.js';

const PomodoroTimer = ({ roomCode }) => {
  const { timerState, startTimer, pauseTimer } = useRoom();
  const [displayTime, setDisplayTime] = useState('25:00');
  const [circumference] = useState(2 * Math.PI * 45); // radius = 45
  const [strokeDashoffset, setStrokeDashoffset] = useState(0);

  useEffect(() => {
    const minutes = Math.floor(timerState.timeLeft / 60);
    const seconds = timerState.timeLeft % 60;
    setDisplayTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

    const totalTime = timerState.phase === 'focus' ? 25 * 60 : 5 * 60;
    const elapsed = totalTime - timerState.timeLeft;
    const progress = (elapsed / totalTime) * 100;
    setStrokeDashoffset(circumference - (progress / 100) * circumference);
  }, [timerState, circumference]);

  const handleStart = () => startTimer(roomCode);
  const handlePause = () => pauseTimer(roomCode);

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
      <h2 className="text-white/60 text-sm uppercase tracking-wide mb-6">
        {timerState.phase === 'focus' ? '🎯 Focus' : '☕ Break'}
      </h2>

      <div className="relative w-64 h-64 mx-auto mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={timerState.phase === 'focus' ? '#7c6fff' : '#00d4aa'}
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-white font-mono">{displayTime}</span>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleStart}
          disabled={timerState.isRunning}
          className="px-6 py-2 bg-purple-accent text-white rounded-full font-semibold hover:shadow-lg hover:shadow-purple-accent/50 disabled:opacity-50 transition-all"
        >
          Start
        </button>
        <button
          onClick={handlePause}
          disabled={!timerState.isRunning}
          className="px-6 py-2 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 disabled:opacity-50 transition-all"
        >
          Pause
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
