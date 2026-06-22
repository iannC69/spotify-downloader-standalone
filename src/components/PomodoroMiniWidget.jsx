import { Link, useLocation } from 'react-router-dom';
import { Clock3, Pause, Play, RotateCcw, X } from 'lucide-react';
import { formatPomodoroTime, usePomodoroSession } from '../context/pomodoroSessionCore';
import './PomodoroMiniWidget.css';

export default function PomodoroMiniWidget() {
  const location = useLocation();
  const {
    activePreset,
    focusTask,
    isRunning,
    progress,
    resetTimer,
    timeLeft,
    toggleTimer,
  } = usePomodoroSession();

  const shouldShow = location.pathname !== '/pomodoro' && isRunning;
  if (!shouldShow) return null;

  return (
    <aside className="pomodoro-mini-widget" style={{ '--mini-accent': activePreset.accent, '--mini-progress': `${progress}%` }}>
      <div className="mini-progress-bar"><span></span></div>
      <div className="mini-widget-icon">
        <Clock3 size={18} />
      </div>
      <div className="mini-widget-copy">
        <span>{activePreset.label}</span>
        <strong>{formatPomodoroTime(timeLeft)}</strong>
        <small>{focusTask || 'No linked task'}</small>
      </div>
      <div className="mini-widget-actions">
        <button type="button" onClick={toggleTimer} title={isRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}>
          {isRunning ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>
        <button type="button" onClick={resetTimer} title="Reset Pomodoro">
          <RotateCcw size={15} />
        </button>
        <Link to="/pomodoro" title="Open Pomodoro">
          <X size={15} />
        </Link>
      </div>
    </aside>
  );
}
