import { Trash2 } from 'lucide-react';
import { Task } from '@weekflow/shared/types';
import { useWeekStore } from '@weekflow/shared/stores';
import { CATEGORY_COLORS, PRIORITY_COLORS } from '@weekflow/shared/lib/constants';
import Badge from '../ui/Badge';

interface TaskCardProps {
  task: Task;
  weekId: string;
}

export default function TaskCard({ task, weekId }: TaskCardProps) {
  const toggleTask = useWeekStore((s) => s.toggleTask);
  const deleteTask = useWeekStore((s) => s.deleteTask);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-opacity ${
        task.done ? 'opacity-50' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => toggleTask(task.id, weekId)}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
          task.done
            ? 'border-success bg-success'
            : 'border-border hover:border-accent'
        }`}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.done && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            task.done ? 'text-muted line-through' : 'text-white'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge label={task.category} color={CATEGORY_COLORS[task.category]} />
          <Badge label={task.priority} color={PRIORITY_COLORS[task.priority]} />
          <span className="text-xs text-muted">{task.estimated_hours}h</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => deleteTask(task.id, weekId)}
        className="flex-shrink-0 p-1 text-muted transition-colors hover:text-danger"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
