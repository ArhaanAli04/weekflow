import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Play, Square } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWeekStore, useReportStore, useJournalStore } from '@weekflow/shared/stores';
import { TaskPriority } from '@weekflow/shared/types';
import { PRIORITY_COLORS, VALIDATION } from '@weekflow/shared/lib/constants';
import { getWeekLabel, getPreviousWeekId, getDatesInWeek } from '@weekflow/shared/utils/weekUtils';
import WeekProgressBar from '../components/tasks/WeekProgressBar';
import CategoryBreakdown from '../components/tasks/CategoryBreakdown';
import TaskCard from '../components/tasks/TaskCard';
import AddTaskModal from '../components/tasks/AddTaskModal';
import CarryOverModal, { hasCarryOverBeenShown } from '../components/tasks/CarryOverModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { toast } from '../components/ui/Toast';

const PRIORITY_GROUPS: TaskPriority[] = ['High', 'Medium', 'Low'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function ThisWeekPage() {
  const navigate = useNavigate();

  // ── store selectors ──────────────────────────────────────────────────────
  const currentWeekId = useWeekStore((s) => s.currentWeekId);
  const week = useWeekStore(useShallow((s) => s.weeks[s.currentWeekId]));
  const tasks = useWeekStore(useShallow((s) => s.tasks[s.currentWeekId] ?? []));
  const lastWeekUnfinished = useWeekStore(useShallow((s) => s.lastWeekUnfinished));
  const weekLoading = useWeekStore((s) => s.loading);
  const createWeekIfNotExists = useWeekStore((s) => s.createWeekIfNotExists);
  const loadCurrentWeek = useWeekStore((s) => s.loadCurrentWeek);
  const loadTasksForWeek = useWeekStore((s) => s.loadTasksForWeek);
  const loadLastWeekUnfinished = useWeekStore((s) => s.loadLastWeekUnfinished);
  const updateWeek = useWeekStore((s) => s.updateWeek);

  const streak = useReportStore((s) => s.streaks?.current_streak ?? 0);
  const generating = useReportStore((s) => s.loading);
  const generateReport = useReportStore((s) => s.generateReport);
  const clearReportError = useReportStore((s) => s.clearError);
  const loadStreak = useReportStore((s) => s.loadStreak);

  const logs = useJournalStore(useShallow((s) => s.logs));
  const loadWeekLogs = useJournalStore((s) => s.loadWeekLogs);

  // ── local state ──────────────────────────────────────────────────────────
  const [intention, setIntention] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCarryOver, setShowCarryOver] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [initDone, setInitDone] = useState(false);

  const intentionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInitRef = useRef(false);
  const intentionInitRef = useRef(false);

  // ── mount: sequential init, parallel side-loads ──────────────────────────
  useEffect(() => {
    async function init() {
      await createWeekIfNotExists(currentWeekId);
      await loadCurrentWeek();
      await loadTasksForWeek(currentWeekId);
      await loadLastWeekUnfinished(getPreviousWeekId(currentWeekId));
      setInitDone(true);
    }

    void init();
    void loadStreak();
    void loadWeekLogs(currentWeekId);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (intentionTimeoutRef.current) clearTimeout(intentionTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekId]);

  // ── sync intention from store on first load ───────────────────────────────
  useEffect(() => {
    if (intentionInitRef.current || !week) return;
    intentionInitRef.current = true;
    setIntention(week.intention ?? '');
  }, [week]);

  // ── resume timer if week was left running ─────────────────────────────────
  useEffect(() => {
    if (timerInitRef.current || !week) return;
    timerInitRef.current = true;

    if (!week.timer_running) return;

    let startedAt: string | null = null;
    try {
      const stored = localStorage.getItem(`weekflow_timer_${currentWeekId}`);
      if (stored) {
        startedAt = (JSON.parse(stored) as { startedAt: string }).startedAt;
      }
    } catch { /* ignore */ }
    startedAt = startedAt ?? week.timer_started_at;

    if (!startedAt) return;
    const at = startedAt;
    setTimerRunning(true);
    setElapsed(Date.now() - new Date(at).getTime());
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - new Date(at).getTime());
    }, 1000);
  }, [week, currentWeekId]);

  // ── carry-over check after init completes ────────────────────────────────
  useEffect(() => {
    if (!initDone) return;
    if (lastWeekUnfinished.length > 0 && !hasCarryOverBeenShown(currentWeekId)) {
      setShowCarryOver(true);
    }
  }, [initDone, lastWeekUnfinished.length, currentWeekId]);

  // ── handlers ─────────────────────────────────────────────────────────────
  function handleIntentionChange(value: string) {
    setIntention(value);
    if (intentionTimeoutRef.current) clearTimeout(intentionTimeoutRef.current);
    intentionTimeoutRef.current = setTimeout(() => {
      void updateWeek(currentWeekId, { intention: value });
    }, 500);
  }

  function handleIntentionBlur() {
    if (intentionTimeoutRef.current) clearTimeout(intentionTimeoutRef.current);
    void updateWeek(currentWeekId, { intention });
  }

  function adjustFocusHours(delta: number) {
    if (!week) return;
    const next = Math.min(
      24,
      Math.max(0, parseFloat((week.focus_hours + delta).toFixed(1)))
    );
    void updateWeek(currentWeekId, { focus_hours: next });
  }

  async function handleStartTimer() {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(
        `weekflow_timer_${currentWeekId}`,
        JSON.stringify({ startedAt: now })
      );
    } catch { /* ignore */ }
    setTimerRunning(true);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - new Date(now).getTime());
    }, 1000);
    await updateWeek(currentWeekId, { timer_running: true, timer_started_at: now });
  }

  async function handleStopTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      localStorage.removeItem(`weekflow_timer_${currentWeekId}`);
    } catch { /* ignore */ }

    const addedHours = Math.max(
      0,
      Math.round((elapsed / 3600000) / VALIDATION.FOCUS_HOURS_STEP) * VALIDATION.FOCUS_HOURS_STEP
    );
    const newFocusHours = (week?.focus_hours ?? 0) + addedHours;

    setTimerRunning(false);
    setElapsed(0);
    await updateWeek(currentWeekId, {
      timer_running: false,
      timer_started_at: null,
      focus_hours: newFocusHours,
    });
  }

  async function handleGenerateReport() {
    await generateReport(currentWeekId);
    const { error } = useReportStore.getState();
    if (error) {
      toast.error(error);
      clearReportError();
    } else {
      toast.success('Weekly report generated!');
      navigate('/report');
    }
  }

  // ── derived values ────────────────────────────────────────────────────────
  const weekDates = getDatesInWeek(currentWeekId);
  const journaledDays = weekDates.filter((d) => !!logs[toDateKey(d)]).length;

  const energyRows: Array<{
    label: string;
    value: number | null;
    onSelect: (n: number) => void;
  }> = [
    {
      label: 'Start',
      value: week?.energy_start ?? null,
      onSelect: (n) => void updateWeek(currentWeekId, { energy_start: n }),
    },
    {
      label: 'End',
      value: week?.energy_end ?? null,
      onSelect: (n) => void updateWeek(currentWeekId, { energy_end: n }),
    },
  ];

  // ── skeleton while first load ─────────────────────────────────────────────
  if (weekLoading && !week) {
    return (
      <div className="flex flex-col gap-6 px-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 animate-pulse rounded-lg bg-surface" />
          <div className="h-5 w-5 animate-pulse rounded bg-surface" />
        </div>
        <div className="h-8 w-full animate-pulse rounded-lg bg-surface" />
        <div className="h-28 w-full animate-pulse rounded-xl bg-surface" />
        <div className="h-28 w-full animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-6 px-4 pb-32 pt-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-white">
              {getWeekLabel(currentWeekId)}
            </h1>
            {streak >= 2 && (
              <span className="text-sm font-medium text-warning">
                🔥 {streak} week streak
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="mt-0.5 p-1 text-muted transition-colors hover:text-white"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="flex flex-col gap-2.5">
          <WeekProgressBar tasks={tasks} />
          <CategoryBreakdown tasks={tasks} />
          <p className="text-xs text-muted">{journaledDays}/7 days journaled</p>
        </div>

        {/* Weekly Intention */}
        <Card>
          <p className="mb-3 text-sm font-semibold text-white">Weekly Intention</p>
          <div className="flex flex-col gap-1.5">
            <textarea
              value={intention}
              onChange={(e) => handleIntentionChange(e.target.value)}
              onBlur={handleIntentionBlur}
              placeholder="What do you want to focus on this week?"
              maxLength={VALIDATION.INTENTION_MAX}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none placeholder:text-muted transition-colors focus:border-accent"
            />
            <p
              className={`self-end text-xs ${
                intention.length >= VALIDATION.INTENTION_MAX ? 'text-danger' : 'text-muted'
              }`}
            >
              {intention.length}/{VALIDATION.INTENTION_MAX}
            </p>
          </div>
        </Card>

        {/* Energy check-in */}
        <Card>
          <p className="mb-3 text-sm font-semibold text-white">Energy Check-in</p>
          <div className="flex flex-col gap-3">
            {energyRows.map(({ label, value, onSelect }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-10 flex-shrink-0 text-sm text-secondary">{label}</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const selected = value === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onSelect(n)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-all"
                        style={
                          selected
                            ? {
                                borderColor: '#6366F1',
                                backgroundColor: '#6366F126',
                                color: '#6366F1',
                              }
                            : {
                                borderColor: 'rgba(255,255,255,0.08)',
                                backgroundColor: 'transparent',
                                color: 'rgba(255,255,255,0.4)',
                              }
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Focus Time */}
        <Card>
          <p className="mb-3 text-sm font-semibold text-white">Focus Time</p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustFocusHours(-VALIDATION.FOCUS_HOURS_STEP)}
                disabled={timerRunning || (week?.focus_hours ?? 0) <= 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-lg text-white transition-colors hover:border-white/20 disabled:opacity-30"
              >
                −
              </button>
              <div className="min-w-[3rem] text-center">
                <p className="text-2xl font-bold text-white">{week?.focus_hours ?? 0}h</p>
                {timerRunning && (
                  <p className="text-xs text-accent">{formatElapsed(elapsed)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => adjustFocusHours(VALIDATION.FOCUS_HOURS_STEP)}
                disabled={timerRunning || (week?.focus_hours ?? 0) >= 24}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-lg text-white transition-colors hover:border-white/20 disabled:opacity-30"
              >
                +
              </button>
            </div>
            <Button
              variant={timerRunning ? 'danger' : 'secondary'}
              onClick={timerRunning ? handleStopTimer : handleStartTimer}
            >
              {timerRunning ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Stop Timer
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Timer
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Task groups */}
        <div className="flex flex-col gap-5">
          {PRIORITY_GROUPS.map((priority) => {
            const groupTasks = tasks.filter((t) => t.priority === priority);
            return (
              <div key={priority}>
                <div className="mb-2.5 flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                  />
                  <span className="text-sm font-medium text-secondary">{priority}</span>
                </div>
                {groupTasks.length === 0 ? (
                  <p className="pl-4 text-xs text-muted">
                    No {priority.toLowerCase()} tasks yet
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {groupTasks.map((task) => (
                      <TaskCard key={task.id} task={task} weekId={currentWeekId} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Generate Report */}
        <button
          type="button"
          onClick={() => void handleGenerateReport()}
          disabled={tasks.length === 0 || generating}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'linear-gradient(to right, #6366F1, #EC4899)' }}
        >
          {generating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analysing your week...
            </>
          ) : (
            'Generate Report'
          )}
        </button>
      </div>

      {/* Floating add button */}
      <button
        type="button"
        onClick={() => setShowAddTask(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showAddTask && (
        <AddTaskModal
          weekId={currentWeekId}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {showCarryOver && (
        <CarryOverModal
          weekId={currentWeekId}
          tasks={lastWeekUnfinished}
          onClose={() => setShowCarryOver(false)}
        />
      )}
    </>
  );
}
