import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useReportStore, useWeekStore } from '@weekflow/shared/stores';
import EmptyState from '../components/ui/EmptyState';
import SkeletonBlock from '../components/ui/SkeletonBlock';
import ReportView from '../components/report/ReportView';

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <SkeletonBlock className="h-52 w-full" />
      <SkeletonBlock className="h-20 w-full" />
      <SkeletonBlock className="h-28 w-full" />
      <SkeletonBlock className="h-28 w-full" />
      <SkeletonBlock className="h-20 w-full" />
    </div>
  );
}

export default function ReportPage() {
  const navigate = useNavigate();

  const currentWeekId = useWeekStore((s) => s.currentWeekId);
  const week = useWeekStore(useShallow((s) => s.weeks[s.currentWeekId]));
  const tasks = useWeekStore(useShallow((s) => s.tasks[s.currentWeekId] ?? []));
  const loadTasksForWeek = useWeekStore((s) => s.loadTasksForWeek);

  const report = useReportStore(useShallow((s) => s.reports[currentWeekId]));
  const loading = useReportStore((s) => s.loading);
  const loadReport = useReportStore((s) => s.loadReport);

  useEffect(() => {
    void loadReport(currentWeekId);
    void loadTasksForWeek(currentWeekId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekId]);

  if (loading && !report) return <ReportSkeleton />;

  if (!report) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          icon={BarChart2}
          title="No report yet"
          subtitle="Generate your report from the This Week page"
          buttonLabel="Go to This Week"
          onButtonClick={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-32 pt-6">
      <ReportView
        report={report}
        tasks={tasks}
        focusHours={week?.focus_hours ?? 0}
      />
    </div>
  );
}
