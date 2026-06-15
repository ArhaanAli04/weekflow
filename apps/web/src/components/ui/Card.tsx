import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

const BASE = 'bg-surface rounded-xl border border-border p-4';

export default function Card({ children, onClick, className = '' }: CardProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${BASE} w-full cursor-pointer text-left transition-colors duration-150 hover:border-white/20 ${className}`}
      >
        {children}
      </button>
    );
  }

  return <div className={`${BASE} ${className}`}>{children}</div>;
}
