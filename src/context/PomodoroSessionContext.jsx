import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { POMODORO_PRESETS, POMODORO_STORAGE_KEY, PomodoroSessionContext } from './pomodoroSessionCore';

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const clampNumber = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
};

const isWorkMode = (modeId) => modeId === 'focus' || modeId === 'deep' || modeId === 'custom';

const getActiveSeconds = (modeId, customMinutes) => {
  const preset = POMODORO_PRESETS.find((item) => item.id === modeId) || POMODORO_PRESETS[0];
  return preset.id === 'custom' ? customMinutes * 60 : preset.minutes * 60;
};

const loadSession = () => {
  const fallback = {
    modeId: 'focus',
    customMinutes: 30,
    timeLeft: POMODORO_PRESETS[0].minutes * 60,
    isRunning: false,
    dailyGoal: 4,
    completedSessions: 0,
    savedDay: getTodayKey(),
    focusTask: '',
    sessionNote: 'Ready when you are.',
    updatedAt: Date.now()
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const sameDay = parsed.savedDay === getTodayKey();
    const modeId = parsed.modeId || fallback.modeId;
    const customMinutes = clampNumber(parsed.customMinutes || fallback.customMinutes, 1, 180);
    const activeSeconds = getActiveSeconds(modeId, customMinutes);
    const elapsed = parsed.isRunning ? Math.floor((Date.now() - (parsed.updatedAt || Date.now())) / 1000) : 0;
    const restoredTime = Math.max(0, clampNumber(parsed.timeLeft || activeSeconds, 0, activeSeconds) - elapsed);

    return {
      ...fallback,
      modeId,
      customMinutes,
      timeLeft: restoredTime,
      isRunning: Boolean(parsed.isRunning && restoredTime > 0),
      dailyGoal: clampNumber(parsed.dailyGoal || fallback.dailyGoal, 1, 12),
      completedSessions: sameDay ? clampNumber(parsed.completedSessions || 0, 0, 99) : 0,
      savedDay: getTodayKey(),
      focusTask: parsed.focusTask || '',
      sessionNote: parsed.sessionNote || fallback.sessionNote,
      updatedAt: Date.now()
    };
  } catch {
    return fallback;
  }
};

export function PomodoroSessionProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());
  const timerRef = useRef(null);
  const alarmSound = useRef(null);

  const activePreset = useMemo(() => (
    POMODORO_PRESETS.find((preset) => preset.id === session.modeId) || POMODORO_PRESETS[0]
  ), [session.modeId]);
  const activeSeconds = getActiveSeconds(session.modeId, session.customMinutes);
  const progress = Math.min(100, Math.max(0, ((activeSeconds - session.timeLeft) / activeSeconds) * 100));
  const completedPercent = Math.min(100, Math.round((session.completedSessions / session.dailyGoal) * 100));

  useEffect(() => {
    alarmSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    alarmSound.current.loop = true;

    return () => {
      alarmSound.current?.pause();
    };
  }, []);

  useEffect(() => {
    const previous = JSON.parse(localStorage.getItem(POMODORO_STORAGE_KEY) || '{}');
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify({
      ...previous,
      ...session,
      updatedAt: Date.now(),
      savedDay: getTodayKey()
    }));
  }, [session]);

  const stopAlarm = useCallback(() => {
    alarmSound.current?.pause();
    if (alarmSound.current) alarmSound.current.currentTime = 0;
  }, []);

  const completeCurrentSession = useCallback(() => {
    setSession((current) => {
      const completedWork = isWorkMode(current.modeId);
      return {
        ...current,
        isRunning: false,
        timeLeft: 0,
        completedSessions: completedWork ? current.completedSessions + 1 : current.completedSessions,
        sessionNote: completedWork ? 'Sesiune finalizata. Ia o pauza si revino fresh.' : 'Pauza gata. Alege urmatorul focus.',
        updatedAt: Date.now()
      };
    });
    alarmSound.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!session.isRunning) {
      clearInterval(timerRef.current);
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setSession((current) => {
        if (!current.isRunning) return current;
        if (current.timeLeft <= 1) {
          clearInterval(timerRef.current);
          window.setTimeout(completeCurrentSession, 0);
          return { ...current, timeLeft: 0, isRunning: false, updatedAt: Date.now() };
        }

        return { ...current, timeLeft: current.timeLeft - 1, updatedAt: Date.now() };
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [completeCurrentSession, session.isRunning]);

  const setMode = useCallback((presetId) => {
    const preset = POMODORO_PRESETS.find((item) => item.id === presetId) || POMODORO_PRESETS[0];
    stopAlarm();
    setSession((current) => ({
      ...current,
      modeId: preset.id,
      timeLeft: getActiveSeconds(preset.id, current.customMinutes),
      isRunning: false,
      sessionNote: preset.description,
      updatedAt: Date.now()
    }));
  }, [stopAlarm]);

  const updateCustomMinutes = useCallback((value) => {
    const next = clampNumber(value, 1, 180);
    setSession((current) => ({
      ...current,
      customMinutes: next,
      timeLeft: current.modeId === 'custom' ? next * 60 : current.timeLeft,
      isRunning: current.modeId === 'custom' ? false : current.isRunning,
      updatedAt: Date.now()
    }));
  }, []);

  const toggleTimer = useCallback(() => {
    stopAlarm();
    setSession((current) => ({
      ...current,
      isRunning: !current.isRunning,
      sessionNote: current.isRunning ? 'Timer pauzat.' : 'Focus pornit. Ramai pe un singur lucru.',
      updatedAt: Date.now()
    }));
  }, [stopAlarm]);

  const resetTimer = useCallback(() => {
    stopAlarm();
    setSession((current) => ({
      ...current,
      isRunning: false,
      timeLeft: getActiveSeconds(current.modeId, current.customMinutes),
      sessionNote: 'Timer resetat.',
      updatedAt: Date.now()
    }));
  }, [stopAlarm]);

  const finishNow = useCallback(() => {
    stopAlarm();
    completeCurrentSession();
  }, [completeCurrentSession, stopAlarm]);

  const startBreak = useCallback(() => {
    const nextMode = session.completedSessions > 0 && session.completedSessions % 4 === 0 ? 'long' : 'short';
    setMode(nextMode);
  }, [session.completedSessions, setMode]);

  const setFocusTask = useCallback((focusTask) => {
    setSession((current) => ({
      ...current,
      focusTask,
      sessionNote: focusTask ? 'Task setat pentru sesiunea curenta.' : current.sessionNote,
      updatedAt: Date.now()
    }));
  }, []);

  const setDailyGoal = useCallback((updater) => {
    setSession((current) => ({
      ...current,
      dailyGoal: clampNumber(typeof updater === 'function' ? updater(current.dailyGoal) : updater, 1, 12),
      updatedAt: Date.now()
    }));
  }, []);

  const resetDay = useCallback(() => {
    stopAlarm();
    setSession((current) => ({
      ...current,
      isRunning: false,
      completedSessions: 0,
      focusTask: '',
      sessionNote: 'Zi resetata.',
      updatedAt: Date.now()
    }));
  }, [stopAlarm]);

  const value = useMemo(() => ({
    ...session,
    activePreset,
    activeSeconds,
    progress,
    completedPercent,
    presets: POMODORO_PRESETS,
    setMode,
    updateCustomMinutes,
    toggleTimer,
    resetTimer,
    finishNow,
    startBreak,
    setFocusTask,
    setDailyGoal,
    resetDay,
    stopAlarm,
  }), [
    activePreset,
    activeSeconds,
    finishNow,
    progress,
    completedPercent,
    resetDay,
    resetTimer,
    session,
    setDailyGoal,
    setFocusTask,
    setMode,
    startBreak,
    stopAlarm,
    toggleTimer,
    updateCustomMinutes
  ]);

  return (
    <PomodoroSessionContext.Provider value={value}>
      {children}
    </PomodoroSessionContext.Provider>
  );
}
