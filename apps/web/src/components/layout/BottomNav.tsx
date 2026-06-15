import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BarChart2, Clock, TrendingUp, type LucideIcon } from 'lucide-react';

interface Tab {
  label: string;
  path: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { label: 'This Week', path: '/', icon: Home },
  { label: 'Journal', path: '/journal', icon: BookOpen },
  { label: 'Report', path: '/report', icon: BarChart2 },
  { label: 'History', path: '/history', icon: Clock },
  { label: 'Dashboard', path: '/dashboard', icon: TrendingUp },
];

function isActive(tabPath: string, locationPath: string): boolean {
  if (tabPath === '/') return locationPath === '/';
  return locationPath.startsWith(tabPath);
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(({ label, path, icon: Icon }) => {
          const active = isActive(path, pathname);
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                active ? 'text-accent' : 'text-muted hover:text-secondary'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
