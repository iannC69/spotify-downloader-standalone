import { createContext, useContext } from 'react';
import { BatteryCharging, Coffee, Crosshair, Flame, Settings2 } from 'lucide-react';

export const POMODORO_STORAGE_KEY = 'pomodoroFocusState_v1';

export const POMODORO_PRESETS = [
  { id: 'focus', label: 'Focus', minutes: 25, icon: Crosshair, accent: '#D2FF00', description: 'Pentru task-uri normale.' },
  { id: 'deep', label: 'Deep Work', minutes: 50, icon: Flame, accent: '#38bdf8', description: 'Pentru munca serioasa.' },
  { id: 'short', label: 'Short Break', minutes: 5, icon: Coffee, accent: '#22c55e', description: 'Respira putin.' },
  { id: 'long', label: 'Long Break', minutes: 15, icon: BatteryCharging, accent: '#a78bfa', description: 'Reset complet.' },
  { id: 'custom', label: 'Custom', minutes: 30, icon: Settings2, accent: '#f97316', description: 'Setezi tu durata.' }
];

export const PomodoroSessionContext = createContext(null);

export const formatPomodoroTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');

  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

export const usePomodoroSession = () => {
  const context = useContext(PomodoroSessionContext);
  if (!context) {
    throw new Error('usePomodoroSession must be used inside PomodoroSessionProvider');
  }
  return context;
};
