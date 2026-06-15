import { useState } from 'react';
import { X } from 'lucide-react';
import { TaskCategory, TaskPriority } from '@weekflow/shared/types';
import { useWeekStore } from '@weekflow/shared/stores';
import { CATEGORY_COLORS, PRIORITY_COLORS, VALIDATION } from '@weekflow/shared/lib/constants';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from '../ui/Toast';

const CATEGORIES: TaskCategory[] = ['Work', 'Health', 'Personal', 'Learning', 'Other'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

interface AddTaskModalProps {
  weekId: string;
  onClose: () => void;
}

export default function AddTaskModal({ weekId, onClose }: AddTaskModalProps) {
  const addTask = useWeekStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setLoading(true);
    await addTask(weekId, {
      week_id: weekId,
      title: title.trim(),
      category,
      priority,
      estimated_hours: hours,
    });
    setLoading(false);
    toast.success('Task added');
    onClose();
  }

  function adjustHours(delta: number) {
    setHours((prev) =>
      Math.min(24, Math.max(0, parseFloat((prev + delta).toFixed(1))))
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] rounded-t-2xl border-t border-border bg-surface p-6 pb-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Add Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <Input
            label="Task title"
            placeholder="What do you want to accomplish?"
            value={title}
            maxLength={VALIDATION.TASK_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-secondary">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                  style={
                    category === cat
                      ? {
                          backgroundColor: `${CATEGORY_COLORS[cat]}26`,
                          color: CATEGORY_COLORS[cat],
                          borderColor: CATEGORY_COLORS[cat],
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: 'rgba(255,255,255,0.4)',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-secondary">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((pri) => (
                <button
                  key={pri}
                  type="button"
                  onClick={() => setPriority(pri)}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                  style={
                    priority === pri
                      ? {
                          backgroundColor: `${PRIORITY_COLORS[pri]}26`,
                          color: PRIORITY_COLORS[pri],
                          borderColor: PRIORITY_COLORS[pri],
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: 'rgba(255,255,255,0.4)',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }
                  }
                >
                  {pri}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-secondary">Estimated hours</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => adjustHours(-VALIDATION.FOCUS_HOURS_STEP)}
                disabled={hours <= 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-lg text-white transition-colors hover:border-white/20 disabled:opacity-30"
              >
                −
              </button>
              <span className="w-10 text-center font-medium text-white">{hours}h</span>
              <button
                type="button"
                onClick={() => adjustHours(VALIDATION.FOCUS_HOURS_STEP)}
                disabled={hours >= 24}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-lg text-white transition-colors hover:border-white/20 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            loading={loading}
            disabled={!title.trim()}
            className="mt-1 w-full"
          >
            Add Task
          </Button>
        </div>
      </div>
    </div>
  );
}
