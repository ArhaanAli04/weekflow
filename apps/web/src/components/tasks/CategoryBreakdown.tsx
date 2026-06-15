import { Task, TaskCategory } from '@weekflow/shared/types';
import { CATEGORY_COLORS } from '@weekflow/shared/lib/constants';

interface CategoryBreakdownProps {
  tasks: Task[];
}

const CATEGORY_ORDER: TaskCategory[] = ['Work', 'Health', 'Personal', 'Learning', 'Other'];

export default function CategoryBreakdown({ tasks }: CategoryBreakdownProps) {
  const stats = CATEGORY_ORDER
    .map((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat);
      return { cat, total: catTasks.length, done: catTasks.filter((t) => t.done).length };
    })
    .filter(({ total }) => total > 0);

  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {stats.map(({ cat, done, total }, i) => (
        <span key={cat} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted">·</span>}
          <span className="font-medium" style={{ color: CATEGORY_COLORS[cat] }}>
            {cat}
          </span>
          <span className="text-muted">
            {done}/{total}
          </span>
        </span>
      ))}
    </div>
  );
}
