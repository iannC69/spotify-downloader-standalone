import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  Copy,
  Filter,
  Flag,
  GitBranch,
  GripVertical,
  Layers3,
  ListFilter,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  X
} from 'lucide-react';
import './TodoMaker.css';

const STORAGE_KEY = 'todoMakerState_v1';

const STATUSES = [
  { id: 'backlog', label: 'Backlog', icon: ClipboardList },
  { id: 'todo', label: 'To Do', icon: CircleDot, limit: 6 },
  { id: 'progress', label: 'In Progress', icon: Clock3, limit: 4 },
  { id: 'review', label: 'Review', icon: ShieldAlert, limit: 3 },
  { id: 'done', label: 'Done', icon: CheckCircle2 }
];

const PRIORITIES = [
  { id: 'critical', label: 'Critical', color: '#ef4444' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'low', label: 'Low', color: '#22c55e' }
];

const TYPES = [
  { id: 'feature', label: 'Feature', icon: Sparkles },
  { id: 'bug', label: 'Bug', icon: AlertTriangle },
  { id: 'task', label: 'Task', icon: ClipboardList },
  { id: 'research', label: 'Research', icon: Search }
];

const TEAM = ['IANNC', 'Design', 'Backend', 'QA', 'Community'];
const SPRINTS = ['Sprint 18', 'Sprint 19', 'Backlog'];

const EPICS = [
  { id: 'core', label: 'Core Workflow', color: '#D2FF00' },
  { id: 'automation', label: 'Automation', color: '#3b82f6' },
  { id: 'community', label: 'Community Ops', color: '#a855f7' },
  { id: 'polish', label: 'UI Polish', color: '#f59e0b' }
];

const todayOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const DEFAULT_TASKS = [
  {
    id: 'TM-101',
    title: 'Construire board Kanban pentru task-uri',
    description: 'Coloane, WIP limits, mutare rapida si flow complet pentru sprint.',
    status: 'progress',
    priority: 'critical',
    type: 'feature',
    epic: 'core',
    sprint: 'Sprint 18',
    assignee: 'IANNC',
    estimate: 8,
    dueDate: todayOffset(1),
    labels: ['frontend', 'board'],
    blocked: false,
    createdAt: todayOffset(-2),
    updatedAt: todayOffset(0)
  },
  {
    id: 'TM-102',
    title: 'Filtre avansate pentru sprint si priority',
    description: 'Search global, filtre pe owner, epic, sprint si prioritate.',
    status: 'todo',
    priority: 'high',
    type: 'task',
    epic: 'core',
    sprint: 'Sprint 18',
    assignee: 'IANNC',
    estimate: 5,
    dueDate: todayOffset(3),
    labels: ['filters'],
    blocked: false,
    createdAt: todayOffset(-2),
    updatedAt: todayOffset(-1)
  },
  {
    id: 'TM-103',
    title: 'Template pentru release checklist',
    description: 'Un set rapid de task-uri pentru deploy, QA, comunicare si rollback.',
    status: 'backlog',
    priority: 'medium',
    type: 'feature',
    epic: 'automation',
    sprint: 'Backlog',
    assignee: 'Backend',
    estimate: 8,
    dueDate: todayOffset(10),
    labels: ['template', 'release'],
    blocked: false,
    createdAt: todayOffset(-5),
    updatedAt: todayOffset(-4)
  },
  {
    id: 'TM-104',
    title: 'Audit copy pentru mesajele din UI',
    description: 'Text mai scurt, consistent si usor de scanat in zonele dense.',
    status: 'review',
    priority: 'medium',
    type: 'research',
    epic: 'polish',
    sprint: 'Sprint 18',
    assignee: 'Design',
    estimate: 3,
    dueDate: todayOffset(0),
    labels: ['copy', 'ux'],
    blocked: false,
    createdAt: todayOffset(-3),
    updatedAt: todayOffset(0)
  },
  {
    id: 'TM-105',
    title: 'Conectare idei comunitate la backlog',
    description: 'Transforma feedback-ul comunitatii in task-uri urmaribile.',
    status: 'todo',
    priority: 'low',
    type: 'task',
    epic: 'community',
    sprint: 'Sprint 19',
    assignee: 'Community',
    estimate: 5,
    dueDate: todayOffset(7),
    labels: ['feedback'],
    blocked: true,
    createdAt: todayOffset(-1),
    updatedAt: todayOffset(-1)
  },
  {
    id: 'TM-106',
    title: 'Export task board pentru raport saptamanal',
    description: 'Rezumat cu done, blocked, remaining si next up.',
    status: 'done',
    priority: 'high',
    type: 'feature',
    epic: 'automation',
    sprint: 'Sprint 18',
    assignee: 'IANNC',
    estimate: 3,
    dueDate: todayOffset(-1),
    labels: ['report'],
    blocked: false,
    createdAt: todayOffset(-6),
    updatedAt: todayOffset(-1)
  }
];

const getPriority = (id) => PRIORITIES.find((priority) => priority.id === id) || PRIORITIES[2];
const getType = (id) => TYPES.find((type) => type.id === id) || TYPES[2];
const getEpic = (id) => EPICS.find((epic) => epic.id === id) || EPICS[0];
const getStatusIndex = (status) => STATUSES.findIndex((item) => item.id === status);

const makeIssueId = (tasks) => {
  const max = tasks.reduce((highest, task) => {
    const number = Number(task.id.replace(/\D/g, ''));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 100);
  return `TM-${max + 1}`;
};

const createInitialState = () => ({
  tasks: DEFAULT_TASKS,
  activeView: 'board',
  activeSprint: 'Sprint 18'
});

function loadStoredState() {
  if (typeof window === 'undefined') return createInitialState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_TASKS
    };
  } catch {
    return createInitialState();
  }
}

function TodoMaker() {
  const [initialState] = useState(loadStoredState);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [activeView, setActiveView] = useState(initialState.activeView);
  const [activeSprint, setActiveSprint] = useState(initialState.activeSprint);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragTargetStatus, setDragTargetStatus] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    priority: 'all',
    assignee: 'all',
    epic: 'all',
    type: 'all',
    blocked: 'all'
  });
  const [quickTask, setQuickTask] = useState({
    title: '',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    assignee: 'IANNC'
  });

  useEffect(() => {
    const nextStoredState = { tasks, activeView, activeSprint };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStoredState));
  }, [tasks, activeView, activeSprint]);

  const filteredTasks = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return tasks.filter((task) => {
      const queryMatch = !query || [
        task.id,
        task.title,
        task.description,
        task.assignee,
        task.sprint,
        ...task.labels
      ].join(' ').toLowerCase().includes(query);

      return (
        queryMatch &&
        (activeSprint === 'all' || task.sprint === activeSprint) &&
        (filters.priority === 'all' || task.priority === filters.priority) &&
        (filters.assignee === 'all' || task.assignee === filters.assignee) &&
        (filters.epic === 'all' || task.epic === filters.epic) &&
        (filters.type === 'all' || task.type === filters.type) &&
        (filters.blocked === 'all' || task.blocked === (filters.blocked === 'blocked'))
      );
    });
  }, [activeSprint, filters, tasks]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [selectedTaskId, tasks]
  );

  const activeFilterCount = useMemo(() => (
    Object.entries(filters).filter(([key, value]) => key !== 'query' && value !== 'all').length
  ), [filters]);

  const metrics = useMemo(() => {
    const sprintTasks = activeSprint === 'all' ? tasks : tasks.filter((task) => task.sprint === activeSprint);
    const donePoints = sprintTasks
      .filter((task) => task.status === 'done')
      .reduce((total, task) => total + Number(task.estimate || 0), 0);
    const remainingPoints = sprintTasks
      .filter((task) => task.status !== 'done')
      .reduce((total, task) => total + Number(task.estimate || 0), 0);
    const dueSoon = sprintTasks.filter((task) => {
      const due = new Date(task.dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / 86400000);
      return task.status !== 'done' && diffDays <= 2;
    }).length;

    return {
      total: sprintTasks.length,
      done: sprintTasks.filter((task) => task.status === 'done').length,
      blocked: sprintTasks.filter((task) => task.blocked).length,
      dueSoon,
      donePoints,
      remainingPoints
    };
  }, [activeSprint, tasks]);

  const columns = useMemo(
    () => STATUSES.map((status) => ({
      ...status,
      tasks: filteredTasks.filter((task) => task.status === status.id)
    })),
    [filteredTasks]
  );

  const focusTasks = useMemo(() => {
    const scopedTasks = activeSprint === 'all'
      ? tasks
      : tasks.filter((task) => task.sprint === activeSprint);

    const urgentTasks = scopedTasks
      .filter((task) => task.status !== 'done')
      .filter((task) => {
        const due = new Date(task.dueDate);
        const now = new Date();
        const diffDays = Math.ceil((due - now) / 86400000);
        return task.blocked || diffDays <= 2 || ['critical', 'high'].includes(task.priority);
      })
      .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate));

    return (urgentTasks.length ? urgentTasks : scopedTasks.filter((task) => task.status !== 'done')).slice(0, 3);
  }, [activeSprint, tasks]);

  const updateTask = (taskId, patch) => {
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === taskId
        ? { ...task, ...patch, updatedAt: new Date().toISOString().slice(0, 10) }
        : task
    )));
  };

  const createTask = (event) => {
    event.preventDefault();
    const title = quickTask.title.trim();
    if (!title) return;

    const nextTask = {
      id: makeIssueId(tasks),
      title,
      description: '',
      status: quickTask.status,
      priority: quickTask.priority,
      type: quickTask.type,
      epic: 'core',
      sprint: activeSprint === 'all' ? 'Sprint 18' : activeSprint,
      assignee: quickTask.assignee,
      estimate: 3,
      dueDate: todayOffset(5),
      labels: ['new'],
      blocked: false,
      createdAt: todayOffset(0),
      updatedAt: todayOffset(0)
    };

    setTasks((currentTasks) => [nextTask, ...currentTasks]);
    setSelectedTaskId(nextTask.id);
    setQuickTask((current) => ({ ...current, title: '' }));
  };

  const deleteTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    setSelectedTaskId((currentId) => (currentId === taskId ? null : currentId));
  };

  const duplicateTask = (task) => {
    const nextTask = {
      ...task,
      id: makeIssueId(tasks),
      title: `${task.title} copy`,
      status: 'backlog',
      createdAt: todayOffset(0),
      updatedAt: todayOffset(0)
    };
    setTasks((currentTasks) => [nextTask, ...currentTasks]);
    setSelectedTaskId(nextTask.id);
  };

  const moveTask = (task, direction) => {
    const currentIndex = getStatusIndex(task.status);
    const nextStatus = STATUSES[currentIndex + direction];
    if (nextStatus) updateTask(task.id, { status: nextStatus.id });
  };

  const handleDrop = (status) => {
    if (draggedTaskId) {
      updateTask(draggedTaskId, { status });
    }
    setDraggedTaskId(null);
    setDragTargetStatus(null);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      priority: 'all',
      assignee: 'all',
      epic: 'all',
      type: 'all',
      blocked: 'all'
    });
    setActiveSprint('Sprint 18');
  };

  const resetBoard = () => {
    if (window.confirm('Resetezi To-Do Maker la datele demo?')) {
      const initial = createInitialState();
      setTasks(initial.tasks);
      setActiveView(initial.activeView);
      setActiveSprint(initial.activeSprint);
      setSelectedTaskId(null);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  };

  const renderTaskCard = (task) => {
    const priority = getPriority(task.priority);
    const type = getType(task.type);
    const epic = getEpic(task.epic);
    const TypeIcon = type.icon;
    const due = new Date(task.dueDate);
    const overdue = task.status !== 'done' && due < new Date(new Date().toDateString());

    return (
      <article
        key={task.id}
        className={`todo-card ${selectedTask?.id === task.id ? 'selected' : ''} ${task.blocked ? 'blocked' : ''}`}
        draggable
        onDragStart={(event) => {
          setDraggedTaskId(task.id);
          event.dataTransfer.setData('text/plain', task.id);
        }}
        onDragEnd={() => {
          setDraggedTaskId(null);
          setDragTargetStatus(null);
        }}
        onClick={() => setSelectedTaskId(task.id)}
      >
        <div className="todo-card-topline">
          <span className="issue-key">{task.id}</span>
          <span className="priority-chip" style={{ '--priority-color': priority.color }}>
            <Flag size={12} />
            {priority.label}
          </span>
        </div>

        <h3>{task.title}</h3>

        <div className="todo-card-meta">
          <span><TypeIcon size={13} /> {type.label}</span>
          <span><Layers3 size={13} /> {epic.label}</span>
          <span className={overdue ? 'danger-text' : ''}><CalendarDays size={13} /> {task.dueDate}</span>
        </div>

        <div className="todo-label-row">
          {task.labels.slice(0, 3).map((label) => (
            <span key={label} className="todo-label">{label}</span>
          ))}
        </div>

        <div className="todo-card-footer">
          <span className="avatar-token">{task.assignee.slice(0, 2).toUpperCase()}</span>
          <span className="story-points">{task.estimate} pts</span>
          {task.blocked && <span className="blocked-chip"><AlertTriangle size={12} /> Blocked</span>}
        </div>

        <div className="todo-card-actions" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => moveTask(task, -1)}
            disabled={getStatusIndex(task.status) === 0}
            title="Mută la stânga"
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <GripVertical size={16} className="drag-handle" />
          <button
            type="button"
            className="icon-btn"
            onClick={() => moveTask(task, 1)}
            disabled={getStatusIndex(task.status) === STATUSES.length - 1}
            title="Mută la dreapta"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className={`todo-maker-shell ${selectedTask ? 'inspector-open' : ''}`}>
      <aside className="todo-side-nav">
        <Link to="/" className="todo-back-link">
          <ArrowLeft size={18} />
          <span>Inapoi</span>
        </Link>
        <div className="todo-product-mark">
          <ClipboardList size={22} />
          <span>To-Do Maker</span>
        </div>
        <button
          className={`todo-view-btn ${activeView === 'board' ? 'active' : ''}`}
          onClick={() => setActiveView('board')}
          title="Board"
        >
          <BarChart3 size={18} />
          <span>Board</span>
        </button>
        <button
          className={`todo-view-btn ${activeView === 'backlog' ? 'active' : ''}`}
          onClick={() => setActiveView('backlog')}
          title="Backlog"
        >
          <ListFilter size={18} />
          <span>Backlog</span>
        </button>
        <button
          className={`todo-view-btn ${activeView === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveView('roadmap')}
          title="Roadmap"
        >
          <GitBranch size={18} />
          <span>Roadmap</span>
        </button>
      </aside>

      <main className="todo-workspace">
        <header className="todo-header">
          <div>
            <p className="todo-eyebrow">IANNC Tools / Project Management</p>
            <h1>To-Do List Maker</h1>
            <p className="todo-header-subtitle">Planifica rapid, muta task-uri pe board si deschide detaliile doar cand ai nevoie.</p>
          </div>

          <div className="todo-header-actions">
            <select value={activeSprint} onChange={(event) => setActiveSprint(event.target.value)}>
              <option value="all">Toate sprinturile</option>
              {SPRINTS.map((sprint) => (
                <option key={sprint} value={sprint}>{sprint}</option>
              ))}
            </select>
            <button className="todo-secondary-btn" onClick={resetBoard}>
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </header>

        <section className="todo-metrics-grid">
          <div className="metric-tile">
            <span>Total</span>
            <strong>{metrics.total}</strong>
          </div>
          <div className="metric-tile">
            <span>Done</span>
            <strong>{metrics.done}</strong>
          </div>
          <div className="metric-tile warning">
            <span>Blocked</span>
            <strong>{metrics.blocked}</strong>
          </div>
          <div className="metric-tile danger">
            <span>Due soon</span>
            <strong>{metrics.dueSoon}</strong>
          </div>
          <div className="metric-tile wide">
            <span>Velocity</span>
            <strong>{metrics.donePoints} / {metrics.donePoints + metrics.remainingPoints} pts</strong>
          </div>
        </section>

        <section className="focus-strip" aria-label="Focus tasks">
          <div className="focus-strip-header">
            <div>
              <span>Focus acum</span>
              <strong>{focusTasks.length ? 'Task-uri care merita atentia ta' : 'Nu ai task-uri urgente'}</strong>
            </div>
          </div>
          <div className="focus-task-list">
            {focusTasks.map((task) => (
              <button key={task.id} type="button" onClick={() => setSelectedTaskId(task.id)}>
                <span className="focus-task-key">{task.id}</span>
                <span className="focus-task-title">{task.title}</span>
                <span className="focus-task-meta">{task.dueDate}</span>
              </button>
            ))}
          </div>
        </section>

        <form className="quick-create-bar" onSubmit={createTask}>
          <span className="quick-create-label">Task nou</span>
          <div className="quick-title-field">
            <Plus size={18} />
            <input
              value={quickTask.title}
              onChange={(event) => setQuickTask((current) => ({ ...current, title: event.target.value }))}
              placeholder="Creeaza task nou..."
            />
          </div>
          <select value={quickTask.type} onChange={(event) => setQuickTask((current) => ({ ...current, type: event.target.value }))}>
            {TYPES.map((type) => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          <select value={quickTask.priority} onChange={(event) => setQuickTask((current) => ({ ...current, priority: event.target.value }))}>
            {PRIORITIES.map((priority) => (
              <option key={priority.id} value={priority.id}>{priority.label}</option>
            ))}
          </select>
          <select value={quickTask.assignee} onChange={(event) => setQuickTask((current) => ({ ...current, assignee: event.target.value }))}>
            {TEAM.map((member) => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
          <button className="todo-primary-btn" type="submit">
            <Save size={16} />
            Adauga
          </button>
        </form>

        <section className="todo-filter-panel">
          <div className="todo-search">
            <Search size={18} />
            <input
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search issue, label, owner..."
            />
          </div>

          <button className="todo-secondary-btn compact filter-toggle-btn" onClick={() => setShowFilters((value) => !value)} type="button">
            <Filter size={15} />
            Filtre {activeFilterCount ? `(${activeFilterCount})` : ''}
          </button>

          <div className={`todo-filter-controls ${showFilters ? 'visible' : ''}`}>
            <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
              <option value="all">Priority</option>
              {PRIORITIES.map((priority) => (
                <option key={priority.id} value={priority.id}>{priority.label}</option>
              ))}
            </select>
            <select value={filters.assignee} onChange={(event) => setFilters((current) => ({ ...current, assignee: event.target.value }))}>
              <option value="all">Assignee</option>
              {TEAM.map((member) => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
            <select value={filters.epic} onChange={(event) => setFilters((current) => ({ ...current, epic: event.target.value }))}>
              <option value="all">Epic</option>
              {EPICS.map((epic) => (
                <option key={epic.id} value={epic.id}>{epic.label}</option>
              ))}
            </select>
            <select value={filters.blocked} onChange={(event) => setFilters((current) => ({ ...current, blocked: event.target.value }))}>
              <option value="all">State</option>
              <option value="blocked">Blocked</option>
              <option value="open">Open</option>
            </select>
            <button className="todo-secondary-btn compact" onClick={resetFilters} type="button">
              <X size={15} />
              Clear
            </button>
          </div>
        </section>

        {activeView === 'board' && (
          <section className="kanban-board" aria-label="Task board">
            {columns.map((column) => {
              const Icon = column.icon;
              const overLimit = column.limit && column.tasks.length > column.limit;

              return (
                <div
                  className={`kanban-column ${dragTargetStatus === column.id ? 'drop-ready' : ''}`}
                  key={column.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragTargetStatus(column.id);
                  }}
                  onDragLeave={() => setDragTargetStatus(null)}
                  onDrop={() => handleDrop(column.id)}
                >
                  <div className="kanban-column-header">
                    <div>
                      <Icon size={17} />
                      <h2>{column.label}</h2>
                    </div>
                    <span className={overLimit ? 'limit-badge over' : 'limit-badge'}>
                      {column.tasks.length}{column.limit ? ` / ${column.limit}` : ''}
                    </span>
                  </div>

                  <div className="kanban-column-body">
                    {column.tasks.length > 0 ? (
                      column.tasks.map(renderTaskCard)
                    ) : (
                      <div className="empty-column">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {activeView === 'backlog' && (
          <section className="backlog-view">
            <div className="backlog-table-header">
              <span>Issue</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Owner</span>
              <span>Due</span>
              <span>Pts</span>
            </div>
            {filteredTasks.map((task) => (
              <button
                key={task.id}
                className={`backlog-row ${selectedTask?.id === task.id ? 'selected' : ''}`}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <span>
                  <strong>{task.id}</strong>
                  {task.title}
                </span>
                <span>{STATUSES.find((status) => status.id === task.status)?.label}</span>
                <span style={{ color: getPriority(task.priority).color }}>{getPriority(task.priority).label}</span>
                <span>{task.assignee}</span>
                <span>{task.dueDate}</span>
                <span>{task.estimate}</span>
              </button>
            ))}
          </section>
        )}

        {activeView === 'roadmap' && (
          <section className="roadmap-view">
            {EPICS.map((epic) => {
              const epicTasks = filteredTasks.filter((task) => task.epic === epic.id);
              const done = epicTasks.filter((task) => task.status === 'done').length;
              const progress = epicTasks.length ? Math.round((done / epicTasks.length) * 100) : 0;

              return (
                <div className="roadmap-lane" key={epic.id} style={{ '--epic-color': epic.color }}>
                  <div className="roadmap-lane-header">
                    <div>
                      <span className="epic-dot"></span>
                      <h2>{epic.label}</h2>
                    </div>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="roadmap-progress">
                    <span style={{ width: `${progress}%` }}></span>
                  </div>
                  <div className="roadmap-items">
                    {epicTasks.map((task) => (
                      <button key={task.id} onClick={() => setSelectedTaskId(task.id)}>
                        <span>{task.id}</span>
                        {task.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {selectedTask && (
        <aside className="task-inspector">
            <div className="inspector-header">
              <div>
                <span>{selectedTask.id}</span>
                <h2>{selectedTask.title}</h2>
              </div>
              <button className="icon-btn" onClick={() => setSelectedTaskId(null)} title="Inchide">
                <X size={18} />
              </button>
            </div>

            <div className="inspector-section">
              <label>Title</label>
              <input
                value={selectedTask.title}
                onChange={(event) => updateTask(selectedTask.id, { title: event.target.value })}
              />
            </div>

            <div className="inspector-section">
              <label>Description</label>
              <textarea
                value={selectedTask.description}
                onChange={(event) => updateTask(selectedTask.id, { description: event.target.value })}
              />
            </div>

            <div className="inspector-grid">
              <div className="inspector-section">
                <label>Status</label>
                <select value={selectedTask.status} onChange={(event) => updateTask(selectedTask.id, { status: event.target.value })}>
                  {STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div className="inspector-section">
                <label>Priority</label>
                <select value={selectedTask.priority} onChange={(event) => updateTask(selectedTask.id, { priority: event.target.value })}>
                  {PRIORITIES.map((priority) => (
                    <option key={priority.id} value={priority.id}>{priority.label}</option>
                  ))}
                </select>
              </div>
              <div className="inspector-section">
                <label>Type</label>
                <select value={selectedTask.type} onChange={(event) => updateTask(selectedTask.id, { type: event.target.value })}>
                  {TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="inspector-section">
                <label>Epic</label>
                <select value={selectedTask.epic} onChange={(event) => updateTask(selectedTask.id, { epic: event.target.value })}>
                  {EPICS.map((epic) => (
                    <option key={epic.id} value={epic.id}>{epic.label}</option>
                  ))}
                </select>
              </div>
              <div className="inspector-section">
                <label>Assignee</label>
                <select value={selectedTask.assignee} onChange={(event) => updateTask(selectedTask.id, { assignee: event.target.value })}>
                  {TEAM.map((member) => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
              <div className="inspector-section">
                <label>Sprint</label>
                <select value={selectedTask.sprint} onChange={(event) => updateTask(selectedTask.id, { sprint: event.target.value })}>
                  {SPRINTS.map((sprint) => (
                    <option key={sprint} value={sprint}>{sprint}</option>
                  ))}
                </select>
              </div>
              <div className="inspector-section">
                <label>Estimate</label>
                <input
                  type="number"
                  min="0"
                  value={selectedTask.estimate}
                  onChange={(event) => updateTask(selectedTask.id, { estimate: Number(event.target.value) })}
                />
              </div>
              <div className="inspector-section">
                <label>Due date</label>
                <input
                  type="date"
                  value={selectedTask.dueDate}
                  onChange={(event) => updateTask(selectedTask.id, { dueDate: event.target.value })}
                />
              </div>
            </div>

            <div className="inspector-section">
              <label>Labels</label>
              <input
                value={selectedTask.labels.join(', ')}
                onChange={(event) => updateTask(selectedTask.id, {
                  labels: event.target.value.split(',').map((label) => label.trim()).filter(Boolean)
                })}
              />
            </div>

            <label className="blocked-toggle">
              <input
                type="checkbox"
                checked={selectedTask.blocked}
                onChange={(event) => updateTask(selectedTask.id, { blocked: event.target.checked })}
              />
              <span>Blocked</span>
            </label>

            <div className="inspector-actions">
              <button className="todo-secondary-btn" onClick={() => duplicateTask(selectedTask)}>
                <Copy size={16} />
                Duplicate
              </button>
              <button className="todo-danger-btn" onClick={() => deleteTask(selectedTask.id)}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>

            <div className="task-timeline">
              <div>
                <Target size={15} />
                Created {selectedTask.createdAt}
              </div>
              <div>
                <Clock3 size={15} />
                Updated {selectedTask.updatedAt}
              </div>
            </div>
        </aside>
      )}
    </div>
  );
}

export default TodoMaker;
