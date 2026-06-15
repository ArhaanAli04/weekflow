import { useState, useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWeekStore, useJournalStore } from '@weekflow/shared/stores';
import { VALIDATION } from '@weekflow/shared/lib/constants';
import { getWeekLabel, getDatesInWeek, getDayLabel } from '@weekflow/shared/utils/weekUtils';

const JOURNAL_MAX = VALIDATION.JOURNAL_MAX;

const DAY_PLACEHOLDERS: Record<string, string> = {
  Monday: 'e.g. Had a productive morning, skipped gym',
  Wednesday: 'e.g. Watched a movie, played FIFA with friends',
};
const DEFAULT_PLACEHOLDER = 'What happened today?';

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
  return toDateKey(new Date());
}

interface DayCardProps {
  date: Date;
  dateKey: string;
  isToday: boolean;
  isFuture: boolean;
  initialContent: string;
  onSave: (dateKey: string, content: string) => void;
}

function DayCard({ date, dateKey, isToday, isFuture, initialContent, onSave }: DayCardProps) {
  const [content, setContent] = useState(initialContent);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when the store loads data after mount
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const scheduleAutoSave = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) onSave(dateKey, value);
      }, 300);
    },
    [dateKey, onSave],
  );

  function handleChange(value: string) {
    setContent(value);
    scheduleAutoSave(value);
  }

  function handleBlur() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (content.trim()) onSave(dateKey, content);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const dayName = getDayLabel(date);
  const isoDate = dateKey;

  const charCount = content.length;
  const counterColor =
    charCount >= JOURNAL_MAX
      ? 'text-danger'
      : charCount >= 450
      ? 'text-warning'
      : 'text-muted';

  const borderStyle = isToday
    ? { borderColor: '#6366F1' }
    : { borderColor: 'rgba(255,255,255,0.08)' };

  return (
    <div
      className="rounded-xl border bg-surface p-4 transition-opacity"
      style={{ ...borderStyle, opacity: isFuture ? 0.5 : 1 }}
    >
      {/* Card header */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-sm font-semibold"
          style={{ color: isToday ? '#6366F1' : 'rgba(255,255,255,0.6)' }}
        >
          {dayName}
        </span>
        <span className="text-xs text-muted">{isoDate}</span>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        disabled={isFuture}
        placeholder={DAY_PLACEHOLDERS[dayName] ?? DEFAULT_PLACEHOLDER}
        maxLength={JOURNAL_MAX}
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none placeholder:text-muted transition-colors focus:border-accent disabled:cursor-not-allowed disabled:select-none"
      />

      {/* Character counter */}
      <p className={`mt-1 text-right text-xs ${counterColor}`}>
        {charCount}/{JOURNAL_MAX}
      </p>
    </div>
  );
}

export default function JournalPage() {
  const currentWeekId = useWeekStore((s) => s.currentWeekId);
  const logs = useJournalStore(useShallow((s) => s.logs));
  const loadWeekLogs = useJournalStore((s) => s.loadWeekLogs);
  const upsertLog = useJournalStore((s) => s.upsertLog);

  useEffect(() => {
    void loadWeekLogs(currentWeekId);
  }, [currentWeekId, loadWeekLogs]);

  const weekDates = getDatesInWeek(currentWeekId);
  const today = todayKey();

  const handleSave = useCallback(
    (dateKey: string, content: string) => {
      void upsertLog(dateKey, content);
    },
    [upsertLog],
  );

  // Week summary stats
  const daysWithEntries = weekDates.filter((d) => {
    const log = logs[toDateKey(d)];
    return log && log.content.trim().length > 0;
  }).length;

  const totalChars = weekDates.reduce((sum, d) => {
    const log = logs[toDateKey(d)];
    return sum + (log ? log.content.length : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-4 px-4 pb-32 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold text-white">Daily Journal</h1>
        <p className="text-sm text-secondary">{getWeekLabel(currentWeekId)}</p>
      </div>

      {/* Day cards */}
      {weekDates.map((date) => {
        const dateKey = toDateKey(date);
        const isToday = dateKey === today;
        const isFuture = dateKey > today;
        const initialContent = logs[dateKey]?.content ?? '';

        return (
          <DayCard
            key={dateKey}
            date={date}
            dateKey={dateKey}
            isToday={isToday}
            isFuture={isFuture}
            initialContent={initialContent}
            onSave={handleSave}
          />
        );
      })}

      {/* Week summary */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-white">Week Summary</p>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-bold" style={{ color: '#6366F1' }}>
              {daysWithEntries}
            </span>
            <span className="text-xs text-muted">days logged</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-bold text-white">{totalChars}</span>
            <span className="text-xs text-muted">chars written</span>
          </div>
        </div>
      </div>
    </div>
  );
}
