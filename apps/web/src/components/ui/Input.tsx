import { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

export default function Input({
  label,
  error,
  maxLength,
  value,
  className = '',
  ...rest
}: InputProps) {
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-secondary">{label}</label>
      )}
      <input
        {...rest}
        value={value}
        maxLength={maxLength}
        className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-white outline-none placeholder:text-muted transition-colors duration-150 ${error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'}`}
      />
      {(error || maxLength) && (
        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-danger">{error}</p>
          ) : (
            <span />
          )}
          {maxLength && (
            <p className={`text-xs ${charCount >= maxLength ? 'text-danger' : 'text-muted'}`}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
