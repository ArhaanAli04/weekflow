import { useEffect, useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useWeekStore, useReportStore } from '@weekflow/shared/stores';
import { CATEGORY_COLORS } from '@weekflow/shared/lib/constants';
import { TaskCategory } from '@weekflow/shared/types';
import {
  getWeekId,
  getPreviousWeekId,
  calculateCompletionRate,
} from '@weekflow/shared/utils/weekUtils';
import Card from '../components/ui/Card';
import SkeletonBlock from '../components/ui/SkeletonBlock';

const CATEGORIES: TaskCategory[] = ['Work', 'Health', 'Personal', 'Learning', 'Other'];

function getLastNWeekIds(n: number): string[] {
  const result: string[] = [];
  let wid = getWeekId();
  for (let i = 0; i < n; i++) {
    result.push(wid);
    wid = getPreviousWeekId(wid);
  }
  return result; // [0] = current week, [n-1] = oldest
}

function shortLabel(weekId: string): string {
  const parts = weekId.split('-').map(Number);
  const month = parts[1];
  const day = parts[2];
  return new Date(2000, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function completionColor(rate: number): string {
  if (rate >= 80) return '#22C55E';
  if (rate >= 50) return '#F59E0B';
  return '#EF4444';
}

interface TooltipEntry {
  value?: number | string;
  name?: string | number;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      {label != null && (
        <p className="mb-1 text-xs text-muted">{String(label)}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="font-semibold" style={{ color: entry.color ?? '#fff' }}>
          {entry.name != null ? `${String(entry.name)}: ` : ''}
          {entry.value}
        </p>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <SkeletonBlock className="h-32 w-full" />
      <SkeletonBlock className="h-56 w-full" />
      <SkeletonBlock className="h-56 w-full" />
      <SkeletonBlock className="h-56 w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const currentWeekId = useMemo(() => getWeekId(), []);

  const loadAllWeeks = useWeekStore((s) => s.loadAllWeeks);
  const loadAllTasks = useWeekStore((s) => s.loadAllTasks);
  const tasksMap = useWeekStore(useShallow((s) => s.tasks));

  const loadAllReports = useReportStore((s) => s.loadAllReports);
  const loadStreak = useReportStore((s) => s.loadStreak);
  const reports = useReportStore(useShallow((s) => s.reports));
  const streak = useReportStore(useShallow((s) => s.streaks));

  useEffect(() => {
    void Promise.all([
      loadAllWeeks(),
      loadAllTasks(),
      loadAllReports(),
      loadStreak(),
    ]).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Streak dots: oldest left → current right ─────────────────────────────
  const streakDotWeeks = useMemo(() => getLastNWeekIds(10).reverse(), []);

  // ─── Weekly Score: last 12 weeks that have a report ───────────────────────
  const scoreData = useMemo(
    () =>
      getLastNWeekIds(12)
        .reverse()
        .filter((wId) => reports[wId] != null)
        .map((wId) => ({
          label: shortLabel(wId),
          score: reports[wId]?.overall_score ?? 0,
        })),
    [reports],
  );

  // ─── Completion Rate: last 12 weeks with at least one task ────────────────
  const completionData = useMemo(
    () =>
      getLastNWeekIds(12)
        .reverse()
        .filter((wId) => (tasksMap[wId]?.length ?? 0) > 0)
        .map((wId) => ({
          label: shortLabel(wId),
          rate: calculateCompletionRate(tasksMap[wId] ?? []),
        })),
    [tasksMap],
  );

  // ─── Category stacked: last 8 weeks ───────────────────────────────────────
  const categoryStackData = useMemo(
    () =>
      getLastNWeekIds(8)
        .reverse()
        .map((wId) => {
          const weekTasks = tasksMap[wId] ?? [];
          const row: Record<string, string | number> = { label: shortLabel(wId) };
          for (const cat of CATEGORIES) {
            row[cat] = weekTasks.filter((t) => t.category === cat).length;
          }
          return row;
        }),
    [tasksMap],
  );

  // ─── All-time category donut ──────────────────────────────────────────────
  const allTasksFlat = useMemo(
    () => Object.values(tasksMap).flat(),
    [tasksMap],
  );
  const categoryPieData = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        name: cat,
        value: allTasksFlat.filter((t) => t.category === cat).length,
        color: CATEGORY_COLORS[cat],
      })).filter((d) => d.value > 0),
    [allTasksFlat],
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      {/* ── Streak Card ──────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl font-bold leading-none"
                style={{
                  color:
                    (streak?.current_streak ?? 0) > 0
                      ? '#F97316'
                      : 'rgba(255,255,255,0.3)',
                }}
              >
                {streak?.current_streak ?? 0}
              </span>
              <span className="text-sm text-secondary">weeks streak</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Longest ever</p>
            <p className="text-lg font-bold text-accent">{streak?.longest_streak ?? 0}</p>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted">Qualifying = 80%+ task completion</p>

        {/* Streak dots */}
        <div className="mt-3 flex items-center gap-2">
          {streakDotWeeks.map((wId) => {
            const weekTasks = tasksMap[wId] ?? [];
            const rate = calculateCompletionRate(weekTasks);
            const qualifying = weekTasks.length > 0 && rate >= 80;
            const isCurrent = wId === currentWeekId;
            return (
              <div
                key={wId}
                title={`${shortLabel(wId)} — ${weekTasks.length > 0 ? `${rate}%` : 'no tasks'}`}
                className={[
                  'h-3 w-3 rounded-full border-2 transition-colors',
                  qualifying ? 'border-success bg-success' : 'border-white/20 bg-transparent',
                  isCurrent ? 'animate-pulse' : '',
                ].join(' ')}
              />
            );
          })}
        </div>
      </Card>

      {/* ── Weekly Score LineChart ────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-white">Weekly Score</h2>
        {scoreData.length < 2 ? (
          <p className="py-8 text-center text-sm text-muted">
            Generate at least 2 reports to see your score trend
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={scoreData}
              margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ fill: '#6366F1', r: 4 }}
                activeDot={{ r: 6, fill: '#6366F1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Completion Rate BarChart ──────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-white">Completion Rate</h2>
        {completionData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No task data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={completionData}
              margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="rate"
                radius={[4, 4, 0, 0] as [number, number, number, number]}
              >
                {completionData.map((entry, index) => (
                  <Cell key={index} fill={completionColor(entry.rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Tasks by Category Stacked BarChart ───────────────────────────────── */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-white">Tasks by Category</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={categoryStackData}
            margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            {CATEGORIES.map((cat) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="stack"
                fill={CATEGORY_COLORS[cat]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              <span className="text-xs text-secondary">{cat}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── All-Time Category Split (Donut) ──────────────────────────────────── */}
      {categoryPieData.length > 0 && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-white">
            All-Time Category Split
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ value }: { value?: number }) =>
                  value != null ? String(value) : ''
                }
                labelLine={false}
              >
                {categoryPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-4">
            {categoryPieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-secondary">{entry.name}</span>
                <span className="text-xs font-bold text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
