import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  buttonLabel,
  onButtonClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-full bg-white/5 p-4">
        <Icon className="h-8 w-8 text-muted" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-white">{title}</p>
        <p className="text-sm text-secondary">{subtitle}</p>
      </div>
      {buttonLabel && onButtonClick && (
        <Button variant="primary" onClick={onButtonClick}>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
