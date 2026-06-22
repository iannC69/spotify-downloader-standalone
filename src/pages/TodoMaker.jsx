import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Dumbbell,
  Flag,
  FolderPlus,
  Gamepad2,
  Home,
  Inbox,
  Layers,
  ListChecks,
  ListTodo,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  Users,
  X
} from 'lucide-react';
import './TodoMaker.css';

const STORAGE_KEY = 'todoMakerState_v1';

const ICON_OPTIONS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'personal', label: 'Personal', icon: Home },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'health', label: 'Health', icon: Dumbbell },
  { id: 'ideas', label: 'Ideas', icon: Sparkles }
];

const ICONS = ICON_OPTIONS.reduce((map, item) => ({ ...map, [item.id]: item.icon }), {});

const CATEGORY_COLORS = ['#D2FF00', '#38bdf8', '#a78bfa', '#fb7185', '#f97316', '#22c55e'];

const DEFAULT_CATEGORIES = [
  { id: 'general', name: 'General', icon: 'inbox', color: '#94a3b8' },
  { id: 'code', name: 'Code', icon: 'code', color: '#D2FF00' },
  { id: 'community', name: 'Community', icon: 'community', color: '#38bdf8' },
  { id: 'personal', name: 'Personal', icon: 'personal', color: '#fb7185' }
];

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    description: 'Ce trebuie planificat.',
    icon: Circle,
    empty: 'Nimic de inceput.'
  },
  {
    id: 'progress',
    title: 'Doing',
    description: 'Focusul tau de acum.',
    icon: Clock3,
    empty: 'Nimic in lucru.'
  },
  {
    id: 'done',
    title: 'Done',
    description: 'Finalizate si bifate.',
    icon: CheckCircle2,
    empty: 'Inca nu ai terminat nimic.'
  }
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#22c55e' },
  { id: 'normal', label: 'Normal', color: '#D2FF00' },
  { id: 'high', label: 'High', color: '#f97316' }
];

const QUICK_FILTERS = [
  { id: 'all', label: 'Toate', icon: Layers },
  { id: 'today', label: 'Azi', icon: CalendarDays },
  { id: 'focus', label: 'Focus', icon: Target },
  { id: 'important', label: 'Important', icon: Star },
  { id: 'overdue', label: 'Intarziate', icon: AlertTriangle },
  { id: 'done', label: 'Done', icon: CheckCircle2 }
];

const priorityScore = {
  high: 3,
  normal: 2,
  low: 1
};

const todayOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const parseDate = (value) => {
  const [year, month, day] = String(value || todayOffset(0)).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const daysUntil = (value) => {
  const today = parseDate(todayOffset(0));
  const due = parseDate(value);
  return Math.ceil((due - today) / 86400000);
};

const DEFAULT_TASKS = [
  {
    id: 'TD-101',
    title: 'Planifica urmatorul update pentru comunitate',
    status: 'todo',
    priority: 'high',
    categoryId: 'community',
    important: true,
    dueDate: todayOffset(1),
    createdAt: todayOffset(-1),
    note: 'Scrie ce intra in update si ce trebuie testat inainte.',
    checklist: [
      { id: 'TD-101-step-1', text: 'Alege top 3 schimbari importante', done: true },
      { id: 'TD-101-step-2', text: 'Pregateste textul pentru anunt', done: false }
    ]
  },
  {
    id: 'TD-102',
    title: 'Testeaza To-Do Maker pe mobil',
    status: 'progress',
    priority: 'normal',
    categoryId: 'code',
    important: true,
    dueDate: todayOffset(2),
    createdAt: todayOffset(-1),
    note: 'Verifica input-uri, butoane si layout pe ecran mic.',
    checklist: [
      { id: 'TD-102-step-1', text: 'Testeaza adaugarea de task', done: false },
      { id: 'TD-102-step-2', text: 'Testeaza filtrele rapide', done: false }
    ]
  },
  {
    id: 'TD-103',
    title: 'Curata sectiunea Projects din portofoliu',
    status: 'done',
    priority: 'low',
    categoryId: 'personal',
    important: false,
    dueDate: todayOffset(0),
    createdAt: todayOffset(-2),
    note: 'Pastreaza doar cardurile clare si utile.',
    checklist: [
      { id: 'TD-103-step-1', text: 'Reduce inaltimea cardurilor', done: true }
    ]
  }
];

const priorityById = (id) => PRIORITIES.find((priority) => priority.id === id) || PRIORITIES[1];

const slugify = (value) => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const createCategoryId = (categories, name) => {
  const base = slugify(name) || 'category';
  let id = base;
  let index = 2;

  while (categories.some((category) => category.id === id)) {
    id = `${base}-${index}`;
    index += 1;
  }

  return id;
};

const normalizeStatus = (status) => {
  if (status === 'done') return 'done';
  if (status === 'progress' || status === 'review') return 'progress';
  return 'todo';
};

const normalizePriority = (priority) => {
  if (priority === 'critical' || priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'normal';
};

const normalizeCategory = (category, index) => {
  const fallback = DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length] || DEFAULT_CATEGORIES[0];
  const icon = ICONS[category?.icon] ? category.icon : fallback.icon;

  return {
    id: slugify(category?.id || category?.name || fallback.id) || fallback.id,
    name: String(category?.name || fallback.name).slice(0, 24),
    icon,
    color: category?.color || fallback.color
  };
};

const mergeCategories = (storedCategories) => {
  const categoryMap = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));

  if (Array.isArray(storedCategories)) {
    storedCategories.forEach((category, index) => {
      const normalized = normalizeCategory(category, index);
      categoryMap.set(normalized.id, normalized);
    });
  }

  return Array.from(categoryMap.values());
};

const normalizeChecklist = (items, taskId) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: `${taskId}-step-${index + 1}`, text: item, done: false };
      }

      return {
        id: item?.id || `${taskId}-step-${index + 1}`,
        text: String(item?.text || '').trim(),
        done: Boolean(item?.done)
      };
    })
    .filter((item) => item.text);
};

const normalizeTask = (task, index, categoryIds) => {
  const id = task.id || `TD-${101 + index}`;
  const categoryId = categoryIds.has(task.categoryId) ? task.categoryId : 'general';

  return {
    id,
    title: task.title || 'Untitled task',
    status: normalizeStatus(task.status),
    priority: normalizePriority(task.priority),
    categoryId,
    important: Boolean(task.important),
    dueDate: task.dueDate || todayOffset(3),
    createdAt: task.createdAt || todayOffset(0),
    note: task.note || task.description || '',
    checklist: normalizeChecklist(task.checklist, id)
  };
};

const createTaskId = (tasks) => {
  const highest = tasks.reduce((max, task) => {
    const number = Number(String(task.id).replace(/\D/g, ''));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 100);

  return `TD-${highest + 1}`;
};

function loadBoard() {
  if (typeof window === 'undefined') {
    return { tasks: DEFAULT_TASKS, categories: DEFAULT_CATEGORIES };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tasks: DEFAULT_TASKS, categories: DEFAULT_CATEGORIES };

    const parsed = JSON.parse(raw);
    const categories = mergeCategories(parsed.categories);
    const categoryIds = new Set(categories.map((category) => category.id));
    const storedTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const tasks = storedTasks.length
      ? storedTasks.map((task, index) => normalizeTask(task, index, categoryIds))
      : DEFAULT_TASKS.map((task, index) => normalizeTask(task, index, categoryIds));

    return { tasks, categories };
  } catch {
    return { tasks: DEFAULT_TASKS, categories: DEFAULT_CATEGORIES };
  }
}

function CategoryIcon({ icon, size = 14 }) {
  const Icon = ICONS[icon] || Tag;
  return <Icon size={size} />;
}

function TodoMaker() {
  const [board, setBoard] = useState(loadBoard);
  const [draft, setDraft] = useState({
    title: '',
    priority: 'normal',
    dueDate: todayOffset(3),
    categoryId: 'general',
    important: false
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'inbox',
    color: CATEGORY_COLORS[0]
  });
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [stepDrafts, setStepDrafts] = useState({});

  const { tasks, categories } = board;

  const setTasks = (updater) => {
    setBoard((current) => ({
      ...current,
      tasks: typeof updater === 'function' ? updater(current.tasks) : updater
    }));
  };

  const setCategories = (updater) => {
    setBoard((current) => ({
      ...current,
      categories: typeof updater === 'function' ? updater(current.categories) : updater
    }));
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const selectedTask = useMemo(() => (
    tasks.find((task) => task.id === selectedTaskId) || null
  ), [selectedTaskId, tasks]);

  const metrics = useMemo(() => {
    const done = tasks.filter((task) => task.status === 'done').length;
    const doing = tasks.filter((task) => task.status === 'progress').length;
    const important = tasks.filter((task) => task.important && task.status !== 'done').length;
    const overdue = tasks.filter((task) => task.status !== 'done' && daysUntil(task.dueDate) < 0).length;
    const dueSoon = tasks.filter((task) => {
      if (task.status === 'done') return false;
      const diff = daysUntil(task.dueDate);
      return diff >= 0 && diff <= 2;
    }).length;

    return {
      total: tasks.length,
      open: tasks.length - done,
      doing,
      done,
      important,
      overdue,
      dueSoon
    };
  }, [tasks]);

  const categoryCounts = useMemo(() => {
    const counts = new Map(categories.map((category) => [category.id, 0]));

    tasks.forEach((task) => {
      if (task.status !== 'done') {
        counts.set(task.categoryId, (counts.get(task.categoryId) || 0) + 1);
      }
    });

    return counts;
  }, [categories, tasks]);

  const nextFocusTask = useMemo(() => {
    const candidates = tasks
      .filter((task) => task.status !== 'done')
      .sort((a, b) => {
        const score = (task) => (
          (task.important ? 100 : 0)
          + (daysUntil(task.dueDate) < 0 ? 60 : 0)
          + ((priorityScore[task.priority] || 1) * 12)
          - Math.max(daysUntil(task.dueDate), 0)
        );

        return score(b) - score(a);
      });

    return candidates[0] || null;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const diff = daysUntil(task.dueDate);
      const category = categoryById.get(task.categoryId);
      const haystack = `${task.id} ${task.title} ${task.note} ${category?.name || ''}`.toLowerCase();
      const matchesQuery = !cleanQuery || haystack.includes(cleanQuery);
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || task.categoryId === categoryFilter;
      const matchesView = (
        quickFilter === 'today' ? task.status !== 'done' && diff === 0
          : quickFilter === 'focus' ? task.status !== 'done' && (task.important || task.priority === 'high' || diff <= 2)
            : quickFilter === 'important' ? task.important
              : quickFilter === 'overdue' ? task.status !== 'done' && diff < 0
                : quickFilter === 'done' ? task.status === 'done'
                  : true
      );

      return matchesQuery && matchesPriority && matchesCategory && matchesView;
    });
  }, [categoryById, categoryFilter, priorityFilter, query, quickFilter, tasks]);

  const groupedTasks = useMemo(() => (
    COLUMNS.map((column) => ({
      ...column,
      tasks: filteredTasks.filter((task) => task.status === column.id)
    }))
  ), [filteredTasks]);

  const resetFilters = () => {
    setQuery('');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setQuickFilter('all');
  };

  const createTask = (event) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;

    const nextTask = {
      id: createTaskId(tasks),
      title,
      status: 'todo',
      priority: draft.priority,
      categoryId: draft.categoryId,
      important: draft.important,
      dueDate: draft.dueDate || todayOffset(3),
      createdAt: todayOffset(0),
      note: '',
      checklist: []
    };

    setTasks((current) => [nextTask, ...current]);
    setSelectedTaskId(nextTask.id);
    setDraft((current) => ({ ...current, title: '', important: false }));
  };

  const updateTask = (taskId, patch) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task;
      const nextPatch = typeof patch === 'function' ? patch(task) : patch;
      return { ...task, ...nextPatch };
    }));
  };

  const moveTask = (task, direction) => {
    const index = COLUMNS.findIndex((column) => column.id === task.status);
    const nextColumn = COLUMNS[index + direction];
    if (nextColumn) updateTask(task.id, { status: nextColumn.id });
  };

  const toggleDone = (task) => {
    updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  const startFocusTask = () => {
    if (!nextFocusTask) return;
    updateTask(nextFocusTask.id, { status: 'progress', important: true });
    setSelectedTaskId(nextFocusTask.id);
    setQuickFilter('focus');
  };

  const deleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const addCategory = (event) => {
    event.preventDefault();
    const name = newCategory.name.trim();
    if (!name) return;

    const category = {
      id: createCategoryId(categories, name),
      name,
      icon: newCategory.icon,
      color: newCategory.color
    };

    setCategories((current) => [...current, category]);
    setDraft((current) => ({ ...current, categoryId: category.id }));
    setCategoryFilter(category.id);
    setNewCategory((current) => ({ ...current, name: '' }));
  };

  const deleteCategory = (categoryId) => {
    if (categoryId === 'general') return;
    if (!window.confirm('Stergi categoria? Task-urile ei se muta in General.')) return;

    setCategories((current) => current.filter((category) => category.id !== categoryId));
    setTasks((current) => current.map((task) => (
      task.categoryId === categoryId ? { ...task, categoryId: 'general' } : task
    )));
    if (categoryFilter === categoryId) setCategoryFilter('all');
    if (draft.categoryId === categoryId) setDraft((current) => ({ ...current, categoryId: 'general' }));
  };

  const addChecklistItem = (taskId) => {
    const text = (stepDrafts[taskId] || '').trim();
    if (!text) return;

    updateTask(taskId, (task) => ({
      checklist: [
        ...task.checklist,
        { id: `${task.id}-step-${Date.now()}`, text, done: false }
      ]
    }));
    setStepDrafts((current) => ({ ...current, [taskId]: '' }));
  };

  const toggleChecklistItem = (taskId, itemId) => {
    updateTask(taskId, (task) => ({
      checklist: task.checklist.map((item) => (
        item.id === itemId ? { ...item, done: !item.done } : item
      ))
    }));
  };

  const deleteChecklistItem = (taskId, itemId) => {
    updateTask(taskId, (task) => ({
      checklist: task.checklist.filter((item) => item.id !== itemId)
    }));
  };

  const clearDone = () => {
    if (!metrics.done) return;
    if (window.confirm('Stergi toate task-urile finalizate?')) {
      setTasks((current) => current.filter((task) => task.status !== 'done'));
      if (selectedTask?.status === 'done') setSelectedTaskId(null);
    }
  };

  const resetTasks = () => {
    if (window.confirm('Reset To-Do Maker la task-urile demo?')) {
      setBoard({ tasks: DEFAULT_TASKS, categories: DEFAULT_CATEGORIES });
      setDraft({
        title: '',
        priority: 'normal',
        dueDate: todayOffset(3),
        categoryId: 'general',
        important: false
      });
      setSelectedTaskId(null);
      resetFilters();
    }
  };

  const renderTask = (task) => {
    const priority = priorityById(task.priority);
    const category = categoryById.get(task.categoryId) || DEFAULT_CATEGORIES[0];
    const overdue = task.status !== 'done' && daysUntil(task.dueDate) < 0;
    const selected = selectedTaskId === task.id;
    const doneSteps = task.checklist.filter((item) => item.done).length;

    return (
      <article
        className={`simple-task-card ${task.status === 'done' ? 'completed' : ''} ${task.important ? 'important' : ''} ${overdue ? 'overdue' : ''} ${selected ? 'selected' : ''}`}
        key={task.id}
      >
        <div className="simple-task-top">
          <button type="button" className="simple-task-id" onClick={() => setSelectedTaskId(selected ? null : task.id)}>
            {task.id}
          </button>
          <div className="task-top-actions">
            <span className="simple-priority" style={{ '--priority-color': priority.color }}>
              <Flag size={12} />
              {priority.label}
            </span>
            <button
              type="button"
              className={`star-action ${task.important ? 'active' : ''}`}
              onClick={() => updateTask(task.id, { important: !task.important })}
              title={task.important ? 'Scoate de la important' : 'Marcheaza important'}
            >
              <Star size={15} fill={task.important ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="task-category-pill"
          style={{ '--category-color': category.color }}
          onClick={() => setCategoryFilter(category.id)}
          title="Filtreaza dupa categorie"
        >
          <CategoryIcon icon={category.icon} />
          {category.name}
        </button>

        <textarea
          className="simple-task-title"
          value={task.title}
          rows={2}
          onChange={(event) => updateTask(task.id, { title: event.target.value })}
          aria-label={`Task title ${task.id}`}
        />

        <div className="task-info-row">
          <label className={overdue ? 'task-date overdue' : 'task-date'}>
            <CalendarDays size={14} />
            <input
              type="date"
              value={task.dueDate}
              onChange={(event) => updateTask(task.id, { dueDate: event.target.value })}
              aria-label={`Due date ${task.id}`}
            />
          </label>
          <span className="checklist-count">
            <ListChecks size={14} />
            {doneSteps}/{task.checklist.length}
          </span>
        </div>

        {selected && (
          <div className="task-details-panel">
            <label className="detail-field">
              <span>Note</span>
              <textarea
                value={task.note}
                rows={3}
                onChange={(event) => updateTask(task.id, { note: event.target.value })}
                placeholder="Scrie context, linkuri sau ce trebuie sa tii minte..."
              />
            </label>

            <div className="details-grid">
              <label>
                <span>Categorie</span>
                <select value={task.categoryId} onChange={(event) => updateTask(task.id, { categoryId: event.target.value })}>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Prioritate</span>
                <select value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value })}>
                  {PRIORITIES.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="checklist-block">
              <div className="checklist-heading">
                <span>
                  <ListChecks size={15} />
                  Checklist
                </span>
                <strong>{doneSteps}/{task.checklist.length}</strong>
              </div>

              {task.checklist.map((item) => (
                <div className="checklist-item" key={item.id}>
                  <button
                    type="button"
                    className={item.done ? 'check-toggle done' : 'check-toggle'}
                    onClick={() => toggleChecklistItem(task.id, item.id)}
                    title={item.done ? 'Marcheaza nefacut' : 'Marcheaza facut'}
                  >
                    <CheckCircle2 size={15} />
                  </button>
                  <span className={item.done ? 'done' : ''}>{item.text}</span>
                  <button type="button" className="tiny-delete" onClick={() => deleteChecklistItem(task.id, item.id)} title="Sterge pas">
                    <X size={14} />
                  </button>
                </div>
              ))}

              <div className="checklist-add">
                <input
                  value={stepDrafts[task.id] || ''}
                  onChange={(event) => setStepDrafts((current) => ({ ...current, [task.id]: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addChecklistItem(task.id);
                    }
                  }}
                  placeholder="Adauga pas..."
                />
                <button type="button" onClick={() => addChecklistItem(task.id)} title="Adauga pas">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="simple-task-footer">
          <button type="button" className="details-toggle" onClick={() => setSelectedTaskId(selected ? null : task.id)}>
            {selected ? 'Inchide' : 'Detalii'}
          </button>

          <div className="simple-task-actions">
            <button
              type="button"
              className="icon-action"
              onClick={() => moveTask(task, -1)}
              disabled={task.status === 'todo'}
              title="Muta la stanga"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="icon-action done-action"
              onClick={() => toggleDone(task)}
              title={task.status === 'done' ? 'Redeschide' : 'Finalizeaza'}
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              type="button"
              className="icon-action"
              onClick={() => moveTask(task, 1)}
              disabled={task.status === 'done'}
              title="Muta la dreapta"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="icon-action delete-action"
              onClick={() => deleteTask(task.id)}
              title="Sterge"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="simple-todo-shell">
      <header className="simple-todo-header">
        <Link to="/" className="simple-back-link">
          <ArrowLeft size={18} />
          Back
        </Link>

        <div className="simple-title-block">
          <div className="simple-title-icon">
            <ListTodo size={24} />
          </div>
          <div>
            <p>IANNC Tools</p>
            <h1>To-Do Maker</h1>
            <span>Categorii, focus rapid, checklist si task-uri importante.</span>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="simple-reset-btn" onClick={clearDone} disabled={!metrics.done}>
            <Trash2 size={16} />
            Clear done
          </button>
          <button type="button" className="simple-reset-btn" onClick={resetTasks}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </header>

      <section className="simple-stats" aria-label="Task summary">
        <div>
          <span>Total</span>
          <strong>{metrics.total}</strong>
        </div>
        <div>
          <span>Open</span>
          <strong>{metrics.open}</strong>
        </div>
        <div>
          <span>Doing</span>
          <strong>{metrics.doing}</strong>
        </div>
        <div>
          <span>Important</span>
          <strong>{metrics.important}</strong>
        </div>
        <div className={metrics.overdue ? 'danger-stat' : ''}>
          <span>Late</span>
          <strong>{metrics.overdue}</strong>
        </div>
        <div>
          <span>Due soon</span>
          <strong>{metrics.dueSoon}</strong>
        </div>
      </section>

      <section className="planning-grid">
        <div className="planner-card">
          <div className="panel-heading">
            <span>
              <Target size={18} />
              Plan rapid
            </span>
            <button type="button" onClick={startFocusTask} disabled={!nextFocusTask}>
              <Sparkles size={16} />
              Start focus
            </button>
          </div>

          <div className="quick-filter-row">
            {QUICK_FILTERS.map((filter) => {
              const Icon = filter.icon;

              return (
                <button
                  type="button"
                  key={filter.id}
                  className={quickFilter === filter.id ? 'quick-filter active' : 'quick-filter'}
                  onClick={() => setQuickFilter(filter.id)}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="focus-suggestion">
            <span>Urmatorul lucru important</span>
            {nextFocusTask ? (
              <button type="button" onClick={() => setSelectedTaskId(nextFocusTask.id)}>
                <strong>{nextFocusTask.title}</strong>
                <small>{categoryById.get(nextFocusTask.categoryId)?.name || 'General'} - {nextFocusTask.dueDate}</small>
              </button>
            ) : (
              <p>Nu ai task-uri deschise.</p>
            )}
          </div>
        </div>

        <div className="category-card">
          <div className="panel-heading">
            <span>
              <Tag size={18} />
              Categorii
            </span>
            <button type="button" onClick={() => setCategoryFilter('all')}>
              <Layers size={16} />
              Toate
            </button>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={categoryFilter === category.id ? 'category-filter active' : 'category-filter'}
                style={{ '--category-color': category.color }}
                onClick={() => setCategoryFilter(category.id)}
              >
                <CategoryIcon icon={category.icon} />
                <span>{category.name}</span>
                <strong>{categoryCounts.get(category.id) || 0}</strong>
                {category.id !== 'general' && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="category-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteCategory(category.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation();
                        deleteCategory(category.id);
                      }
                    }}
                    title="Sterge categoria"
                  >
                    <X size={13} />
                  </span>
                )}
              </button>
            ))}
          </div>

          <form className="category-create" onSubmit={addCategory}>
            <div className="category-name-field">
              <FolderPlus size={16} />
              <input
                value={newCategory.name}
                onChange={(event) => setNewCategory((current) => ({ ...current, name: event.target.value }))}
                placeholder="Categorie noua..."
              />
            </div>
            <select
              value={newCategory.icon}
              onChange={(event) => setNewCategory((current) => ({ ...current, icon: event.target.value }))}
              aria-label="Icon categorie"
            >
              {ICON_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <select
              value={newCategory.color}
              onChange={(event) => setNewCategory((current) => ({ ...current, color: event.target.value }))}
              aria-label="Culoare categorie"
            >
              {CATEGORY_COLORS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
            <button type="submit" title="Adauga categorie">
              <Plus size={17} />
            </button>
          </form>
        </div>
      </section>

      <form className="simple-add-task" onSubmit={createTask}>
        <div className="simple-add-input">
          <Plus size={18} />
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Scrie task-ul si apasa Enter..."
          />
        </div>
        <select
          value={draft.categoryId}
          onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
          aria-label="Task category"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select
          value={draft.priority}
          onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}
          aria-label="Task priority"
        >
          {PRIORITIES.map((priority) => (
            <option key={priority.id} value={priority.id}>{priority.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={draft.dueDate}
          onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
          aria-label="Task due date"
        />
        <button
          type="button"
          className={draft.important ? 'draft-star active' : 'draft-star'}
          onClick={() => setDraft((current) => ({ ...current, important: !current.important }))}
          title="Marcheaza important"
        >
          <Star size={17} fill={draft.important ? 'currentColor' : 'none'} />
        </button>
        <button type="submit">
          <Plus size={18} />
          Add
        </button>
      </form>

      <section className="simple-toolbar" aria-label="Task filters">
        <div className="simple-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cauta dupa task, nota sau categorie..."
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority.id} value={priority.id}>{priority.label}</option>
          ))}
        </select>
        <button type="button" className="filter-clear" onClick={resetFilters}>
          <X size={16} />
          Clear filters
        </button>
        <span className="visible-count">{filteredTasks.length} visible</span>
      </section>

      <section className="simple-board" aria-label="Task board">
        {groupedTasks.map((column) => {
          const Icon = column.icon;

          return (
            <div className="simple-column" key={column.id}>
              <div className="simple-column-header">
                <div>
                  <Icon size={18} />
                  <h2>{column.title}</h2>
                </div>
                <span>{column.tasks.length}</span>
              </div>
              <p>{column.description}</p>

              <div className="simple-column-body">
                {column.tasks.length ? (
                  column.tasks.map(renderTask)
                ) : (
                  <div className="simple-empty-state">{column.empty}</div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

export default TodoMaker;
