const timerStates = new Map();

const buildState = (focusLength = 25, breakLength = 5) => ({
  phase: 'focus',
  isRunning: false,
  focusLength: focusLength * 60,
  breakLength: breakLength * 60,
  remainingSeconds: focusLength * 60,
  endsAt: null,
  focusMinutesThisSession: 0
});

const ensureTimer = (roomCode) => {
  if (!timerStates.has(roomCode)) {
    timerStates.set(roomCode, buildState());
  }

  return timerStates.get(roomCode);
};

const syncElapsedState = (state) => {
  if (!state.isRunning || !state.endsAt) {
    return state;
  }

  let now = Date.now();

  while (state.isRunning && state.endsAt && now >= state.endsAt) {
    const completedPhase = state.phase;

    if (completedPhase === 'focus') {
      state.focusMinutesThisSession += Math.floor(state.focusLength / 60);
      state.phase = 'break';
      state.remainingSeconds = state.breakLength;
    } else {
      state.phase = 'focus';
      state.remainingSeconds = state.focusLength;
    }

    state.endsAt = now + state.remainingSeconds * 1000;
  }

  if (state.isRunning && state.endsAt) {
    state.remainingSeconds = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
  }

  return state;
};

export const initializeTimer = (roomCode, focusLength = 25, breakLength = 5) => {
  timerStates.set(roomCode, buildState(focusLength, breakLength));
};

export const startTimer = (roomCode) => {
  const state = ensureTimer(roomCode);

  if (!state.isRunning) {
    state.isRunning = true;
    state.endsAt = Date.now() + state.remainingSeconds * 1000;
  }

  return getTimerState(roomCode);
};

export const pauseTimer = (roomCode) => {
  const state = ensureTimer(roomCode);
  syncElapsedState(state);
  state.isRunning = false;
  state.endsAt = null;
  return getTimerState(roomCode);
};

export const getTimerState = (roomCode) => {
  const state = ensureTimer(roomCode);
  syncElapsedState(state);

  return {
    timeLeft: state.remainingSeconds,
    phase: state.phase,
    isRunning: state.isRunning,
    focusMinutesThisSession: state.focusMinutesThisSession
  };
};

export const resetTimer = (roomCode, focusLength = 25, breakLength = 5) => {
  initializeTimer(roomCode, focusLength, breakLength);
  return getTimerState(roomCode);
};

export const getOrInitializeTimer = (roomCode) => getTimerState(roomCode);

export default { initializeTimer, startTimer, pauseTimer, getTimerState, resetTimer, getOrInitializeTimer };
