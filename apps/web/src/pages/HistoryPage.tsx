import { useEffect, useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWeekStore, useReportStore } from '@weekflow/shared/stores';
import { WeekGrade } from '@weekflow/shared/types';
import { getWeekLabel, calculateCompletionRate } from '@weekflow/shared/utils/weekUtils';
import EmptyState from '../components/ui/EmptyState';
import { GRADE_COLORS } from '../components/report/ReportView';

type GradeFilter = 'All' | WeekGrade;
type DateFilter = 'all' | '1m' | '3m';

const GRADE_FILTERS: GradeFilter[] = ['All', 'S', 'A', 'B', 'C', 'D'];

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
];

function getMinDate(range: '1m' | '3m'): string {
  const d = new Date();
  if (range === '1m') d.setMonth(d.getMonth() - 1);
  else d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function slideStyle(index: number): CSSProperties {
  return {
    animation: 'slideInRight 0.3s ease both',
    animationDelay: `${index * 50}ms`,
  };
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const allWeekIds = useWeekStore(useShallow((s) => s.allWeekIds));
  const weeks = useWeekStore(useShallow((s) => s.weeks));
  const allTasks = useWeekStore(useShallow((s) => s.tasks));
  const loading = useWeekStore((s) => s.loading);
  const loadAllWeeks = useWeekStore((s) => s.loadAllWeeks);
  const loadAllTasks = useWeekStore((s) => s.loadAllTasks);

  const reports = useReportStore(useShallow((s) => s.reports));
  const loadAllReports = useReportStore((s) => s.loadAllReports);

  useEffect(() => {
    void Promise.all([loadAllWeeks(), loadAllTasks(), loadAllReports()]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredWeekIds = useMemo(() => {
    let ids = [...allWeekIds].sort((a, b) => b.localeCompare(a));

    if (dateFilter !== 'all') {
      const minDate = getMinDate(dateFilter);
      ids = ids.filter((id) => id >= minDate);
    }

    if (gradeFilter !== 'All') {
      ids = ids.filter((id) => reports[id]?.grade === gradeFilter);
    }

    return ids;
  }, [allWeekIds, dateFilter, gradeFilter, reports]);

  if (loading && allWeekIds.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-4 pt-6">
        <div className="mb-1 h-7 w-24 animate-pulse rounded-lg bg-surface" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  if (allWeekIds.length === 0) {
    return (
      <div className="px-4 pt-6">
        <h1 className="mb-6 text-xl font-bold text-white">History</h1>
        <EmptyState
          icon={Calendar}
          title="No history yet"
          subtitle="Complete a week and generate a report to see it here"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-32">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 bg-background px-4 pb-3 pt-5">
        <h1 className="mb-3 text-xl font-bold text-white">History</h1>

        {/* Grade chips */}
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {GRADE_FILTERS.map((grade) => {
            const isSelected = gradeFilter === grade;
            const chipColor = grade === 'All' ? '#6366F1' : GRADE_COLORS[grade];
            return (
              <button
                key={grade}
                type="button"
                onClick={() => setGradeFilter(grade)}
                className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                style={
                  isSelected
                    ? { backgroundColor: chipColor, color: '#FFFFFF' }
                    : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }
                }
              >
                {grade}
              </button>
            );
          })}
        </div>

        {/* Date range chips */}
        <div className="flex gap-2">
          {DATE_FILTERS.map(({ value, label }) => {
            const isSelected = dateFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setDateFilter(value)}
                className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                style={
                  isSelected
                    ? { backgroundColor: '#6366F1', color: '#FFFFFF' }
                    : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week cards */}
      <div className="flex flex-col gap-3 px-4 pt-2">
        {filteredWeekIds.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No weeks match your filter"
            subtitle="Try a different grade or date range"
          />
        ) : (
          filteredWeekIds.map((weekId, index) => {
            const week = weeks[weekId];
            const report = reports[weekId];
            const tasks = allTasks[weekId] ?? [];
            const completionPct = calculateCompletionRate(tasks);
            const barColor =
              completionPct >= 80 ? '#22C55E' : completionPct >= 50 ? '#F59E0B' : '#6366F1';

            return (
              <button
                key={weekId}
                type="button"
                onClick={() => navigate(`/history/${weekId}`)}
                className="w-full rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-white/20"
                style={slideStyle(index)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {/* Label + fire badge */}
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">
                        {getWeekLabel(weekId)}
                      </span>
                      {completionPct >= 80 && tasks.length > 0 && (
                        <span className="flex-shrink-0 text-sm">🔥</span>
                      )}
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${completionPct}%`, backgroundColor: barColor }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>{tasks.length} tasks</span>
                      {week && <span>{week.focus_hours}h focus</span>}
                    </div>
                  </div>

                  {/* Grade badge */}
                  {report && (
                    <span
                      className="flex-shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold"
                      style={{
                        backgroundColor: `${GRADE_COLORS[report.grade]}26`,
                        color: GRADE_COLORS[report.grade],
                      }}
                    >
                      {report.grade}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
