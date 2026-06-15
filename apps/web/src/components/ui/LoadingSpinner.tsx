interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  );

  if (fullScreen) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}
