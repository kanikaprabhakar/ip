// Server-side timer state per room
const timerStates = new Map(); // room code -> { timeLeft, phase, isRunning, startTime, focusLength, breakLength }

export const initializeTimer = (roomCode, focusLength = 25, breakLength = 5) => {
  timerStates.set(roomCode, {
    timeLeft: focusLength * 60,
    phase: 'focus',
    isRunning: false,
    startTime: null,
    focusLength: focusLength * 60,
    breakLength: breakLength * 60,
    focusMinutesThisSession: 0
  });
};

export const startTimer = (roomCode) => {
  const state = timerStates.get(roomCode);
  if (state) {
    state.isRunning = true;
    state.startTime = Date.now();
  }
};

export const pauseTimer = (roomCode) => {
  const state = timerStates.get(roomCode);
  if (state) {
    state.isRunning = false;
  }
};

export const getTimerState = (roomCode) => {
  if (!timerStates.has(roomCode)) {
    initializeTimer(roomCode);
  }

  const state = timerStates.get(roomCode);
  if (state.isRunning && state.startTime) {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const newTimeLeft = state.timeLeft - elapsed;

    if (newTimeLeft <= 0) {
      // Phase switch
      state.phase = state.phase === 'focus' ? 'break' : 'focus';
      const cycleLength = state.phase === 'focus' ? state.focusLength : state.breakLength;
      state.timeLeft = cycleLength;
      state.startTime = Date.now();
      if (state.phase === 'focus') {
        state.focusMinutesThisSession += Math.floor(cycleLength / 60);
      }
    } else {
      state.timeLeft = newTimeLeft;
    }
  }

  return {
    timeLeft: state.timeLeft,
    phase: state.phase,
    isRunning: state.isRunning,
    focusMinutesThisSession: state.focusMinutesThisSession
  };
};

export const resetTimer = (roomCode, focusLength = 25, breakLength = 5) => {
  initializeTimer(roomCode, focusLength, breakLength);
};

export const getOrInitializeTimer = (roomCode) => {
  if (!timerStates.has(roomCode)) {
    initializeTimer(roomCode);
  }
  return getTimerState(roomCode);
};

export default { initializeTimer, startTimer, pauseTimer, getTimerState, resetTimer, getOrInitializeTimer };
