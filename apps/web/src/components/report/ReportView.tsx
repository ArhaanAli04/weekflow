import type { CSSProperties } from 'react';
import type { Report, Task, WeekGrade } from '@weekflow/shared/types';
import { getWeekLabel } from '@weekflow/shared/utils/weekUtils';
import Card from '../ui/Card';

export const GRADE_COLORS: Record<WeekGrade, string> = {
  S: '#F59E0B',
  A: '#22C55E',
  B: '#6366F1',
  C: '#F97316',
  D: '#EF4444',
};

export const GRADE_LABELS: Record<WeekGrade, string> = {
  S: 'Excellent',
  A: 'Great',
  B: 'Good',
  C: 'Fair',
  D: 'Needs Work',
};

function fadeStyle(index: number): CSSProperties {
  return {
    animation: 'fadeInUp 0.4s ease both',
    animationDelay: `${index * 80}ms`,
  };
}

interface ReportViewProps {
  report: Report;
  tasks: Task[];
  focusHours: number;
}

export default function ReportView({ report, tasks, focusHours }: ReportViewProps) {
  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const gradeColor = GRADE_COLORS[report.grade];
  const gradeLabel = GRADE_LABELS[report.grade];

  const rawJson = report.raw_json;
  const dailyActivityInsight =
    typeof rawJson.dailyActivityInsight === 'string' ? rawJson.dailyActivityInsight : '';
  const priorityAnalysis =
    typeof rawJson.priorityAnalysis === 'string' ? rawJson.priorityAnalysis : '';

  return (
    <div className="flex flex-col gap-4">
      {/* Grade hero */}
      <div style={fadeStyle(0)}>
        <Card>
          <div className="flex flex-col items-center gap-1 py-4 text-center">
            <span style={{ fontSize: 80, lineHeight: 1, color: gradeColor, fontWeight: 700 }}>
              {report.grade}
            </span>
            <span className="mt-1 text-base font-semibold" style={{ color: gradeColor }}>
              {gradeLabel}
            </span>
            <span className="text-sm text-secondary">{report.overall_score}/100</span>
            <span className="text-xs text-muted">{getWeekLabel(report.week_id)}</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white">{report.headline}</p>
          </div>
        </Card>
      </div>

      {/* Stats row */}
      <div style={fadeStyle(1)} className="grid grid-cols-3 gap-2">
        {(
          [
            { label: 'Completion', value: `${completionPct}%`, color: '#6366F1' },
            { label: 'Tasks Done', value: `${doneCount}/${totalCount}`, color: '#FFFFFF' },
            { label: 'Focus Time', value: `${focusHours}h`, color: '#22C55E' },
          ] as const
        ).map(({ label, value, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface py-3 text-center"
          >
            <span className="text-2xl font-bold" style={{ color }}>
              {value}
            </span>
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Wins */}
      <div style={fadeStyle(2)}>
        <Card>
          <p className="mb-3 text-sm font-semibold text-white">Wins</p>
          <ul className="flex flex-col gap-2">
            {report.wins.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                <span className="mt-0.5 flex-shrink-0 text-success">♦</span>
                {win}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Improvements */}
      <div style={fadeStyle(3)}>
        <Card>
          <p className="mb-3 text-sm font-semibold text-white">Improvements</p>
          <ul className="flex flex-col gap-2">
            {report.improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                <span className="mt-0.5 flex-shrink-0 text-warning">♦</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* AI Insights */}
      <div style={fadeStyle(4)}>
        <Card>
          <p className="mb-3 text-sm font-semibold text-white">AI Insights</p>
          <div className="flex flex-col gap-3">
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgba(99,102,241,0.10)', borderLeft: '2px solid #8B5CF6' }}
            >
              <p className="mb-1 text-xs font-semibold" style={{ color: '#8B5CF6' }}>Capacity</p>
              <p className="text-sm leading-relaxed text-secondary">{report.capacity_insight}</p>
            </div>
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgba(236,72,153,0.10)', borderLeft: '2px solid #EC4899' }}
            >
              <p className="mb-1 text-xs font-semibold" style={{ color: '#EC4899' }}>Focus Time</p>
              <p className="text-sm leading-relaxed text-secondary">{report.focus_suggestion}</p>
            </div>
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgba(34,197,94,0.10)', borderLeft: '2px solid #22C55E' }}
            >
              <p className="mb-1 text-xs font-semibold" style={{ color: '#22C55E' }}>Next Week Goal</p>
              <p className="text-sm leading-relaxed text-secondary">{report.next_week_goal}</p>
            </div>
          </div>
        </Card>
      </div>

      {dailyActivityInsight && (
        <div style={fadeStyle(5)}>
          <Card>
            <p className="mb-2 text-sm font-semibold text-white">Daily Activity</p>
            <p className="text-sm leading-relaxed text-secondary">{dailyActivityInsight}</p>
          </Card>
        </div>
      )}

      {priorityAnalysis && (
        <div style={fadeStyle(6)}>
          <Card>
            <p className="mb-2 text-sm font-semibold text-white">Priority Analysis</p>
            <p className="text-sm leading-relaxed text-secondary">{priorityAnalysis}</p>
          </Card>
        </div>
      )}

      {/* Motivational note */}
      <div style={fadeStyle(7)}>
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          <p className="text-sm italic leading-relaxed text-white">{report.motivational_note}</p>
        </div>
      </div>
    </div>
  );
}
