import { cn } from '@/lib/utils';

const statusMap: Record<string, { label?: string; className: string }> = {
  // Green
  approved: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  active: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  sourcing: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  // Yellow
  pending: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  received: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  in_review: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  draft: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  on_hold: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  // Red
  rejected: { className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  closed: { className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  revoked: { className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  inactive: { className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  // Blue
  shortlist_ready: { className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  shortlisted: { className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  // Default
  _default: { className: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status.toLowerCase()] ?? statusMap._default;
  const label = (status.charAt(0).toUpperCase() + status.slice(1)).replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {label}
    </span>
  );
}
