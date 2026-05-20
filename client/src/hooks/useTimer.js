import { useState, useEffect } from 'react';
import { useRoom } from './useSocket.js';

export const useTimer = (roomCode) => {
  const { timerState, startTimer, pauseTimer } = useRoom();
  const [displayTime, setDisplayTime] = useState('25:00');
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const minutes = Math.floor(timerState.timeLeft / 60);
    const seconds = timerState.timeLeft % 60;
    setDisplayTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

    // Calculate progress for circular timer
    const totalTime = timerState.phase === 'focus' ? 25 * 60 : 5 * 60;
    const elapsed = totalTime - timerState.timeLeft;
    setProgress((elapsed / totalTime) * 100);
  }, [timerState]);

  const handleStart = () => startTimer(roomCode);
  const handlePause = () => pauseTimer(roomCode);

  return {
    displayTime,
    progress,
    isRunning: timerState.isRunning,
    phase: timerState.phase,
    timeLeft: timerState.timeLeft,
    handleStart,
    handlePause
  };
};

export default useTimer;
