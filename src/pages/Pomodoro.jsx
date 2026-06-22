import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Coffee,
  Headphones,
  Link as LinkIcon,
  ListChecks,
  Minus,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  Volume2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatPomodoroTime, usePomodoroSession } from '../context/pomodoroSessionCore';
import './Pomodoro.css';

const STORAGE_KEY = 'pomodoroFocusState_v1';
const TODO_STORAGE_KEY = 'todoMakerState_v1';

const DEFAULT_TASKS = [
  { id: 'focus-1', title: 'Alege un task important', done: false },
  { id: 'focus-2', title: 'Inchide tab-urile inutile', done: false },
  { id: 'focus-3', title: 'Noteaza rezultatul dupa sesiune', done: false }
];

const loadTodoBoard = () => {
  if (typeof window === 'undefined') return { tasks: [] };

  try {
    const raw = localStorage.getItem(TODO_STORAGE_KEY);
    if (!raw) return { tasks: [] };
    const parsed = JSON.parse(raw);
    return { tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [] };
  } catch {
    return { tasks: [] };
  }
};

const createTodoTaskId = (tasks) => {
  const highest = tasks.reduce((max, task) => {
    const number = Number(String(task.id || '').replace(/\D/g, ''));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 100);

  return `TD-${highest + 1}`;
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const clampNumber = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
};

const createEmbedUrl = (url) => {
  const trimmed = url.trim();
  if (!trimmed) return '';

  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  const spotifyMatch = trimmed.match(/spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/i);
  if (spotifyMatch?.[1] && spotifyMatch?.[2]) {
    return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}?utm_source=generator&theme=0`;
  }

  return null;
};

const loadState = () => {
  if (typeof window === 'undefined') {
    return {
      dailyGoal: 4,
      completedSessions: 0,
      savedDay: getTodayKey(),
      focusTask: '',
      tasks: DEFAULT_TASKS,
      mediaUrl: '',
      embedUrl: '',
      customMinutes: 30
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('No saved Pomodoro state');

    const parsed = JSON.parse(raw);
    const sameDay = parsed.savedDay === getTodayKey();

    return {
      dailyGoal: clampNumber(parsed.dailyGoal || 4, 1, 12),
      completedSessions: sameDay ? clampNumber(parsed.completedSessions || 0, 0, 99) : 0,
      savedDay: getTodayKey(),
      focusTask: parsed.focusTask || '',
      tasks: Array.isArray(parsed.tasks) && parsed.tasks.length ? parsed.tasks : DEFAULT_TASKS,
      mediaUrl: parsed.mediaUrl || '',
      embedUrl: parsed.embedUrl || '',
      customMinutes: clampNumber(parsed.customMinutes || 30, 1, 180)
    };
  } catch {
    return {
      dailyGoal: 4,
      completedSessions: 0,
      savedDay: getTodayKey(),
      focusTask: '',
      tasks: DEFAULT_TASKS,
      mediaUrl: '',
      embedUrl: '',
      customMinutes: 30
    };
  }
};

function Pomodoro() {
  const [savedState] = useState(() => loadState());
  const {
    activePreset,
    completedPercent,
    completedSessions,
    customMinutes,
    dailyGoal,
    finishNow,
    focusTask,
    isRunning,
    modeId,
    presets,
    progress,
    resetDay: resetPomodoroDay,
    resetTimer,
    sessionNote,
    setDailyGoal,
    setFocusTask,
    setMode,
    startBreak,
    timeLeft,
    toggleTimer,
    updateCustomMinutes,
  } = usePomodoroSession();
  const [tasks, setTasks] = useState(savedState.tasks);
  const [todoBoard, setTodoBoard] = useState(() => loadTodoBoard());
  const [taskDraft, setTaskDraft] = useState('');
  const [mediaUrl, setMediaUrl] = useState(savedState.mediaUrl);
  const [embedUrl, setEmbedUrl] = useState(savedState.embedUrl);
  const [mediaError, setMediaError] = useState('');
  const todoTasks = todoBoard.tasks.filter((task) => task.status !== 'done');
  const doneTodoTasks = todoBoard.tasks.filter((task) => task.status === 'done').length;
  const ActiveIcon = activePreset.icon;

  useEffect(() => {
    const syncTodoBoard = () => setTodoBoard(loadTodoBoard());
    window.addEventListener('storage', syncTodoBoard);
    window.addEventListener('focus', syncTodoBoard);

    return () => {
      window.removeEventListener('storage', syncTodoBoard);
      window.removeEventListener('focus', syncTodoBoard);
    };
  }, []);

  const updateTodoTasks = (updater) => {
    setTodoBoard((current) => {
      const nextTasks = typeof updater === 'function' ? updater(current.tasks) : updater;
      const previous = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || '{}');
      const nextBoard = { ...previous, tasks: nextTasks };
      localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(nextBoard));
      return { ...current, tasks: nextTasks };
    });
  };

  useEffect(() => {
    const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const payload = {
      ...previous,
      dailyGoal,
      completedSessions,
      savedDay: getTodayKey(),
      focusTask,
      tasks,
      mediaUrl,
      embedUrl,
      customMinutes
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [completedSessions, customMinutes, dailyGoal, embedUrl, focusTask, mediaUrl, tasks]);

  const addTask = (event) => {
    event.preventDefault();
    const title = taskDraft.trim();
    if (!title) return;

    updateTodoTasks((current) => {
      const nextTask = {
        id: createTodoTaskId(current),
        title,
        status: 'todo',
        priority: 'medium',
        categoryId: 'general',
        important: false,
        dueDate: getTodayKey(),
        createdAt: getTodayKey(),
        note: '',
        checklist: []
      };

      return [nextTask, ...current];
    });

    if (!focusTask) setFocusTask(title);
    setTaskDraft('');
  };

  const pickTask = (task) => {
    setFocusTask(task.title);
  };

  const handleResetDay = () => {
    resetPomodoroDay();
    setTasks(DEFAULT_TASKS);
  };

  const applyMedia = (event) => {
    event.preventDefault();
    const nextEmbedUrl = createEmbedUrl(mediaUrl);

    if (nextEmbedUrl === null) {
      setMediaError('Pune un link valid de YouTube sau Spotify.');
      return;
    }

    setMediaError('');
    setEmbedUrl(nextEmbedUrl);
  };

  const clearMedia = () => {
    setMediaUrl('');
    setEmbedUrl('');
    setMediaError('');
  };

  return (
    <>
      <Navbar />
      <main className="focus-page">
        <section className="focus-shell">
          <header className="focus-header">
            <Link to="/" className="focus-back-link">
              <ArrowLeft size={18} />
              Back
            </Link>

            <div className="focus-title">
              <div className="focus-title-icon">
                <Clock3 size={24} />
              </div>
              <div>
                <p>IANNC Tools</p>
                <h1>Lofi Pomodoro</h1>
                <span>Timer, task queue, daily goal si audio de focus.</span>
              </div>
            </div>

            <button type="button" className="focus-reset-day" onClick={handleResetDay}>
              <RotateCcw size={16} />
              Reset day
            </button>
          </header>

          <section className="focus-overview" aria-label="Focus summary">
            <div>
              <span>Sessions</span>
              <strong>{completedSessions}/{dailyGoal}</strong>
            </div>
            <div>
              <span>Progress</span>
              <strong>{completedPercent}%</strong>
            </div>
            <div>
              <span>Tasks</span>
              <strong>{doneTodoTasks}/{todoBoard.tasks.length}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{activePreset.label}</strong>
            </div>
          </section>

          <div className="focus-layout">
            <section className="focus-panel timer-card">
              <div className="preset-row">
                {presets.map((preset) => {
                  const Icon = preset.icon;

                  return (
                    <button
                      type="button"
                      key={preset.id}
                      className={modeId === preset.id ? 'preset-btn active' : 'preset-btn'}
                      onClick={() => setMode(preset.id)}
                      style={{ '--preset-color': preset.accent }}
                    >
                      <Icon size={17} />
                      <span>{preset.label}</span>
                      <small>{preset.id === 'custom' ? `${customMinutes}m` : `${preset.minutes}m`}</small>
                    </button>
                  );
                })}
              </div>

              {modeId === 'custom' && (
                <div className="custom-control">
                  <button type="button" onClick={() => updateCustomMinutes(customMinutes - 5)} title="Scade 5 minute">
                    <Minus size={16} />
                  </button>
                  <label>
                    <span>Custom minutes</span>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutes}
                      onChange={(event) => updateCustomMinutes(event.target.value)}
                    />
                  </label>
                  <button type="button" onClick={() => updateCustomMinutes(customMinutes + 5)} title="Adauga 5 minute">
                    <Plus size={16} />
                  </button>
                </div>
              )}

              <div className="timer-stage" style={{ '--progress': progress, '--mode-color': activePreset.accent }}>
                <div className="timer-orbit">
                  <svg viewBox="0 0 320 320" aria-hidden="true">
                    <circle className="timer-track" cx="160" cy="160" r="142" />
                    <circle
                      className="timer-progress"
                      cx="160"
                      cy="160"
                      r="142"
                      strokeDasharray="892.21"
                      strokeDashoffset={892.21 - (progress / 100) * 892.21}
                    />
                  </svg>
                  <div className="timer-core">
                    <span>
                      <ActiveIcon size={18} />
                      {activePreset.label}
                    </span>
                    <strong>{formatPomodoroTime(timeLeft)}</strong>
                    <p>{focusTask || 'Alege un task pentru focus.'}</p>
                  </div>
                </div>
              </div>

              <div className="timer-controls">
                <button type="button" className="main-play-btn" onClick={toggleTimer}>
                  {isRunning ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
                  {isRunning ? 'Pause' : 'Start'}
                </button>
                <button type="button" onClick={resetTimer}>
                  <RotateCcw size={18} />
                  Reset
                </button>
                <button type="button" onClick={finishNow}>
                  <SkipForward size={18} />
                  Finish
                </button>
                <button type="button" onClick={startBreak}>
                  <Coffee size={18} />
                  Break
                </button>
              </div>

              <div className="session-note">
                <Sparkles size={17} />
                <span>{sessionNote}</span>
              </div>
            </section>

            <aside className="focus-side">
              <section className="focus-panel goal-card">
                <div className="panel-heading">
                  <span>
                    <Target size={18} />
                    Daily goal
                  </span>
                  <strong>{completedPercent}%</strong>
                </div>
                <div className="goal-meter">
                  <span style={{ width: `${completedPercent}%` }}></span>
                </div>
                <div className="goal-controls">
                  <button type="button" onClick={() => setDailyGoal((current) => Math.max(1, current - 1))}>
                    <Minus size={16} />
                  </button>
                  <strong>{dailyGoal} sessions</strong>
                  <button type="button" onClick={() => setDailyGoal((current) => Math.min(12, current + 1))}>
                    <Plus size={16} />
                  </button>
                </div>
              </section>

              <section className="focus-panel task-card">
                <div className="panel-heading">
                  <span>
                    <ListChecks size={18} />
                    To-Do Maker tasks
                  </span>
                  <strong>{todoTasks.length} open</strong>
                </div>

                <form className="task-add-form" onSubmit={addTask}>
                  <input
                    value={taskDraft}
                    onChange={(event) => setTaskDraft(event.target.value)}
                    placeholder="Adauga task de focus..."
                  />
                  <button type="submit" title="Adauga task">
                    <Plus size={17} />
                  </button>
                </form>

                <div className="task-list">
                  {todoTasks.length ? todoTasks.map((task) => (
                    <div className={focusTask === task.title ? 'focus-task selected' : 'focus-task'} key={task.id}>
                      <button
                        type="button"
                        className="task-check"
                        onClick={() => updateTodoTasks((current) => current.map((item) => (
                          item.id === task.id ? { ...item, status: 'done' } : item
                        )))}
                        title="Finalizeaza in To-Do Maker"
                      >
                        <Circle size={17} />
                      </button>
                      <button type="button" className="task-title-btn" onClick={() => pickTask(task)}>
                        {task.title}
                      </button>
                      <button
                        type="button"
                        className="task-delete"
                        onClick={() => updateTodoTasks((current) => current.map((item) => (
                          item.id === task.id ? { ...item, status: 'progress', important: true } : item
                        )))}
                        title="Muta in progress"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    </div>
                  )) : (
                    <div className="focus-task empty">
                      <span>Nu ai task-uri deschise in To-Do Maker.</span>
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>

          <section className="focus-panel media-card">
            <div className="panel-heading">
              <span>
                <Radio size={18} />
                Focus audio
              </span>
              <button type="button" onClick={clearMedia} disabled={!mediaUrl && !embedUrl}>
                <X size={16} />
                Clear
              </button>
            </div>

            <form className="media-form" onSubmit={applyMedia}>
              <div className="media-input">
                <LinkIcon size={17} />
                <input
                  value={mediaUrl}
                  onChange={(event) => setMediaUrl(event.target.value)}
                  placeholder="Paste YouTube sau Spotify link..."
                />
              </div>
              <button type="submit">
                <Headphones size={17} />
                Set audio
              </button>
            </form>

            {mediaError && <p className="media-error">{mediaError}</p>}

            <div className="media-frame">
              {embedUrl ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={embedUrl}
                  title="Focus audio"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              ) : (
                <div className="empty-media">
                  <Volume2 size={42} />
                  <strong>No audio set</strong>
                  <span>Pune un link YouTube sau Spotify pentru vibe-ul de lucru.</span>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

export default Pomodoro;
