import { Task } from '@weekflow/shared/types';

interface WeekProgressBarProps {
  tasks: Task[];
}

function barColor(rate: number): string {
  if (rate >= 80) return '#22C55E';
  if (rate >= 50) return '#F59E0B';
  return '#6366F1';
}

export default function WeekProgressBar({ tasks }: WeekProgressBarProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  const totalHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-white">
          {done}/{total} tasks complete
        </span>
        <span className="text-muted">{totalHours}h estimated</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${rate}%`, backgroundColor: barColor(rate) }}
        />
      </div>
    </div>
  );
}
