// TODO: Week detail — task list, report view, daily log summaries for a past week
import { useParams } from 'react-router-dom';

export default function WeekDetailPage() {
  const { weekId } = useParams<{ weekId: string }>();
  return (
    <div className="p-6">
      <p className="text-white">Week {weekId} — coming soon</p>
    </div>
  );
}
