import { useState } from 'react';
import { X } from 'lucide-react';
import { Task } from '@weekflow/shared/types';
import { useWeekStore } from '@weekflow/shared/stores';
import { CATEGORY_COLORS, PRIORITY_COLORS } from '@weekflow/shared/lib/constants';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const STORAGE_KEY = 'carryover_shown_week';

export function hasCarryOverBeenShown(weekId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === weekId;
  } catch {
    return false;
  }
}

function markShown(weekId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, weekId);
  } catch {
    // localStorage unavailable — safe to ignore
  }
}

interface CarryOverModalProps {
  weekId: string;
  tasks: Task[];
  onClose: () => void;
}

export default function CarryOverModal({ weekId, tasks, onClose }: CarryOverModalProps) {
  const carryOverTasks = useWeekStore((s) => s.carryOverTasks);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tasks.map((t) => t.id))
  );
  const [loading, setLoading] = useState(false);

  function handleClose() {
    markShown(weekId);
    onClose();
  }

  async function handleCarryOver() {
    const selectedTasks = tasks.filter((t) => selected.has(t.id));
    if (selectedTasks.length === 0) {
      handleClose();
      return;
    }
    setLoading(true);
    await carryOverTasks(weekId, selectedTasks);
    setLoading(false);
    markShown(weekId);
    onClose();
  }

  function toggleTask(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[480px] rounded-t-2xl border-t border-border bg-surface p-6 pb-8">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Carry over tasks?</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-5 text-sm text-secondary">
          {tasks.length} unfinished {tasks.length === 1 ? 'task' : 'tasks'} from last week. Select which to bring forward.
        </p>

        <div className="mb-6 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => toggleTask(task.id)}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-white/20"
            >
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  selected.has(task.id) ? 'border-accent bg-accent' : 'border-border'
                }`}
              >
                {selected.has(task.id) && (
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
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{task.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge label={task.category} color={CATEGORY_COLORS[task.category]} />
                  <Badge label={task.priority} color={PRIORITY_COLORS[task.priority]} />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Skip
          </Button>
          <Button
            onClick={handleCarryOver}
            loading={loading}
            disabled={selected.size === 0}
            className="flex-1"
          >
            Carry Over ({selected.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
