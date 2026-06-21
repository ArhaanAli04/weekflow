import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { DailyLog } from '@weekflow/shared/types';
import { useWeekStore, useReportStore, useJournalStore } from '@weekflow/shared/stores';
import { CATEGORY_COLORS, PRIORITY_COLORS } from '@weekflow/shared/lib/constants';
import { getDatesInWeek, getDayLabel, getWeekLabel } from '@weekflow/shared/utils/weekUtils';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ReportView from '../components/report/ReportView';
import { toast } from '../components/ui/Toast';

const ENERGY_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E'] as const;

function EnergyDots({ value }: { value: number | null }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor:
              value !== null && n <= value
                ? ENERGY_COLORS[n - 1]
                : 'rgba(255,255,255,0.08)',
          }}
        />
      ))}
    </div>
  );
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HistoryDetailPage() {
  const { weekId = '' } = useParams<{ weekId: string }>();
  const navigate = useNavigate();

  const week = useWeekStore(useShallow((s) => s.weeks[weekId]));
  const tasks = useWeekStore(useShallow((s) => s.tasks[weekId] ?? []));
  const weekLoading = useWeekStore((s) => s.loading);
  const loadWeek = useWeekStore((s) => s.loadWeek);
  const loadTasksForWeek = useWeekStore((s) => s.loadTasksForWeek);

  const report = useReportStore(useShallow((s) => s.reports[weekId]));
  const loadReport = useReportStore((s) => s.loadReport);
  const generating = useReportStore((s) => s.loading);
  const generateReport = useReportStore((s) => s.generateReport);
  const clearReportError = useReportStore((s) => s.clearError);

  const logs = useJournalStore(useShallow((s) => s.logs));
  const loadWeekLogs = useJournalStore((s) => s.loadWeekLogs);

  useEffect(() => {
    if (!weekId) return;
    void Promise.all([
      loadWeek(weekId),
      loadTasksForWeek(weekId),
      loadReport(weekId),
      loadWeekLogs(weekId),
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId]);

  async function handleGenerateReport() {
    await generateReport(weekId);
    const { error } = useReportStore.getState();
    if (error) {
      toast.error(error);
      clearReportError();
    } else {
      toast.success('Report generated!');
      void loadReport(weekId);
    }
  }

  if (!weekId) return null;

  if (weekLoading && !week) {
    return <LoadingSpinner />;
  }

  const weekDates = getDatesInWeek(weekId);

  const journalEntries = weekDates
    .map((d) => {
      const dateKey = toDateKey(d);
      return { date: d, dateKey, log: logs[dateKey] };
    })
    .filter((entry): entry is { date: Date; dateKey: string; log: DailyLog } =>
      entry.log !== undefined && entry.log.content.trim().length > 0
    );

  return (
    <div className="flex flex-col pb-32">
      {/* Back header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="flex items-center gap-0.5 text-sm text-secondary transition-colors hover:text-white"
          aria-label="Back to history"
        >
          <ChevronLeft className="h-4 w-4" />
          History
        </button>
        <span className="ml-auto text-xs text-muted">{getWeekLabel(weekId)}</span>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-2">

        {/* Report or no-report placeholder */}
        {report ? (
          <ReportView
            report={report}
            tasks={tasks}
            focusHours={week?.focus_hours ?? 0}
          />
        ) : (
          <Card>
            <p className="py-2 text-center text-sm text-muted">
              No report generated for this week
            </p>
            {tasks.length > 0 && (
              <button
                type="button"
                onClick={() => void handleGenerateReport()}
                disabled={generating}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, #6366F1, #EC4899)' }}
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analysing your week...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </button>
            )}
          </Card>
        )}

        {/* Week Overview */}
        {week && (
          <Card>
            <p className="mb-3 text-sm font-semibold text-white">Week Overview</p>
            <div className="flex flex-col gap-3">
              {week.intention && (
                <div>
                  <p className="mb-1 text-xs text-muted">Intention</p>
                  <p className="text-sm leading-relaxed text-secondary">{week.intention}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Focus Hours</p>
                <span className="text-sm font-semibold text-white">{week.focus_hours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Energy (Start)</p>
                <EnergyDots value={week.energy_start} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Energy (End)</p>
                <EnergyDots value={week.energy_end} />
              </div>
            </div>
          </Card>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <Card>
            <p className="mb-3 text-sm font-semibold text-white">Tasks</p>
            <ul className="flex flex-col gap-3">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3">
                  {task.done ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span
                      className={`text-sm ${
                        task.done ? 'text-muted line-through' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[task.category]}26`,
                          color: CATEGORY_COLORS[task.category],
                        }}
                      >
                        {task.category}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${PRIORITY_COLORS[task.priority]}26`,
                          color: PRIORITY_COLORS[task.priority],
                        }}
                      >
                        {task.priority}
                      </span>
                      {task.estimated_hours > 0 && (
                        <span className="text-xs text-muted">{task.estimated_hours}h est.</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Journal Entries */}
        {journalEntries.length > 0 && (
          <Card>
            <p className="mb-3 text-sm font-semibold text-white">Journal</p>
            <div className="flex flex-col gap-4">
              {journalEntries.map(({ date, dateKey, log }) => (
                <div key={dateKey}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                    <span className="text-xs font-semibold text-secondary">
                      {getDayLabel(date)} · {dateKey}
                    </span>
                  </div>
                  <p className="pl-4 text-sm leading-relaxed text-secondary">{log.content}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
