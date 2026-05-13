import { cn } from '@/lib/utils';

interface Props {
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ fullScreen, className }: Props) {
  const spinner = (
    <div
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}
