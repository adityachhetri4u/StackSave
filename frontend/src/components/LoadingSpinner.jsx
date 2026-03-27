import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" id="loading-spinner">
      <Loader2 className={`${sizes[size]} text-brand-400 animate-spin`} />
      {text && <p className="text-surface-400 text-sm animate-pulse-soft">{text}</p>}
    </div>
  );
}
