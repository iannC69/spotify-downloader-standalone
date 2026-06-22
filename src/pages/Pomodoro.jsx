import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BatteryCharging,
  CheckCircle2,
  Circle,
  Clock3,
  Coffee,
  Crosshair,
  Flame,
  Headphones,
  Link as LinkIcon,
  ListChecks,
  Minus,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Settings2,
  SkipForward,
  Sparkles,
  Target,
  Trash2,
  Volume2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Pomodoro.css';

const STORAGE_KEY = 'pomodoroFocusState_v1';

const PRESETS = [
  { id: 'focus', label: 'Focus', minutes: 25, icon: Crosshair, accent: '#D2FF00', description: 'Pentru task-uri normale.' },
  { id: 'deep', label: 'Deep Work', minutes: 50, icon: Flame, accent: '#38bdf8', description: 'Pentru munca serioasa.' },
  { id: 'short', label: 'Short Break', minutes: 5, icon: Coffee, accent: '#22c55e', description: 'Respira putin.' },
  { id: 'long', label: 'Long Break', minutes: 15, icon: BatteryCharging, accent: '#a78bfa', description: 'Reset complet.' },
  { id: 'custom', label: 'Custom', minutes: 30, icon: Settings2, accent: '#f97316', description: 'Setezi tu durata.' }
];

const DEFAULT_TASKS = [
  { id: 'focus-1', title: 'Alege un task important', done: false },
  { id: 'focus-2', title: 'Inchide tab-urile inutile', done: false },
  { id: 'focus-3', title: 'Noteaza rezultatul dupa sesiune', done: false }
];

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const clampNumber = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');

  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

const isWorkMode = (modeId) => modeId === 'focus' || modeId === 'deep' || modeId === 'custom';

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
  const [modeId, setModeId] = useState('focus');
  const [customMinutes, setCustomMinutes] = useState(savedState.customMinutes);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(savedState.dailyGoal);
  const [completedSessions, setCompletedSessions] = useState(savedState.completedSessions);
  const [focusTask, setFocusTask] = useState(savedState.focusTask);
  const [tasks, setTasks] = useState(savedState.tasks);
  const [taskDraft, setTaskDraft] = useState('');
  const [mediaUrl, setMediaUrl] = useState(savedState.mediaUrl);
  const [embedUrl, setEmbedUrl] = useState(savedState.embedUrl);
  const [mediaError, setMediaError] = useState('');
  const [sessionNote, setSessionNote] = useState('Ready when you are.');

  const timerRef = useRef(null);
  const alarmSound = useRef(null);
  const finishedRef = useRef(false);

  const activePreset = useMemo(() => PRESETS.find((preset) => preset.id === modeId) || PRESETS[0], [modeId]);
  const activeSeconds = modeId === 'custom' ? customMinutes * 60 : activePreset.minutes * 60;
  const progress = Math.min(100, Math.max(0, ((activeSeconds - timeLeft) / activeSeconds) * 100));
  const completedPercent = Math.min(100, Math.round((completedSessions / dailyGoal) * 100));
  const doneTasks = tasks.filter((task) => task.done).length;
  const ActiveIcon = activePreset.icon;

  useEffect(() => {
    alarmSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    alarmSound.current.loop = true;

    return () => {
      alarmSound.current?.pause();
    };
  }, []);

  useEffect(() => {
    const payload = {
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

  const completeCurrentSession = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsRunning(false);
    alarmSound.current?.play().catch(() => {});

    if (isWorkMode(modeId)) {
      setCompletedSessions((current) => current + 1);
      setSessionNote('Sesiune finalizata. Ia o pauza si revino fresh.');
    } else {
      setSessionNote('Pauza gata. Alege urmatorul focus.');
    }
  }, [modeId]);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(timerRef.current);
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          completeCurrentSession();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [completeCurrentSession, isRunning, modeId]);

  const stopAlarm = () => {
    alarmSound.current?.pause();
    if (alarmSound.current) alarmSound.current.currentTime = 0;
  };

  const setMode = (presetId) => {
    const preset = PRESETS.find((item) => item.id === presetId) || PRESETS[0];
    const seconds = preset.id === 'custom' ? customMinutes * 60 : preset.minutes * 60;

    stopAlarm();
    finishedRef.current = false;
    setIsRunning(false);
    setModeId(preset.id);
    setTimeLeft(seconds);
    setSessionNote(preset.description);
  };

  const updateCustomMinutes = (value) => {
    const next = clampNumber(value, 1, 180);
    setCustomMinutes(next);

    if (modeId === 'custom') {
      finishedRef.current = false;
      setIsRunning(false);
      setTimeLeft(next * 60);
    }
  };

  const toggleTimer = () => {
    stopAlarm();
    finishedRef.current = false;
    setIsRunning((current) => !current);
    setSessionNote(isRunning ? 'Timer pauzat.' : 'Focus pornit. Ramai pe un singur lucru.');
  };

  const resetTimer = () => {
    stopAlarm();
    finishedRef.current = false;
    setIsRunning(false);
    setTimeLeft(activeSeconds);
    setSessionNote('Timer resetat.');
  };

  const finishNow = () => {
    stopAlarm();
    completeCurrentSession();
    setTimeLeft(0);
  };

  const startBreak = () => {
    setMode(completedSessions > 0 && completedSessions % 4 === 0 ? 'long' : 'short');
  };

  const addTask = (event) => {
    event.preventDefault();
    const title = taskDraft.trim();
    if (!title) return;

    const task = {
      id: `focus-${Date.now()}`,
      title,
      done: false
    };

    setTasks((current) => [task, ...current]);
    if (!focusTask) setFocusTask(title);
    setTaskDraft('');
  };

  const toggleTask = (taskId) => {
    setTasks((current) => current.map((task) => (
      task.id === taskId ? { ...task, done: !task.done } : task
    )));
  };

  const deleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  };

  const pickTask = (task) => {
    setFocusTask(task.title);
    setSessionNote('Task setat pentru sesiunea curenta.');
  };

  const resetDay = () => {
    stopAlarm();
    setIsRunning(false);
    setCompletedSessions(0);
    setTasks(DEFAULT_TASKS);
    setFocusTask('');
    setSessionNote('Zi resetata.');
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

            <button type="button" className="focus-reset-day" onClick={resetDay}>
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
              <strong>{doneTasks}/{tasks.length}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{activePreset.label}</strong>
            </div>
          </section>

          <div className="focus-layout">
            <section className="focus-panel timer-card">
              <div className="preset-row">
                {PRESETS.map((preset) => {
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
                    <strong>{formatTime(timeLeft)}</strong>
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
                    Focus queue
                  </span>
                  <strong>{doneTasks}/{tasks.length}</strong>
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
                  {tasks.map((task) => (
                    <div className={task.done ? 'focus-task done' : 'focus-task'} key={task.id}>
                      <button type="button" className="task-check" onClick={() => toggleTask(task.id)} title="Bifeaza">
                        {task.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      </button>
                      <button type="button" className="task-title-btn" onClick={() => pickTask(task)}>
                        {task.title}
                      </button>
                      <button type="button" className="task-delete" onClick={() => deleteTask(task.id)} title="Sterge">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
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
