import { cn } from '@/lib/utils';

type StatusType = 'ok' | 'warn' | 'danger' | 'active' | 'idle';

interface StatusDotProps {
  status: StatusType;
  label: string;
}

const dotColorMap: Record<StatusType, string> = {
  ok: 'bg-bms-ok',
  warn: 'bg-bms-warn',
  danger: 'bg-bms-danger',
  active: 'bg-bms-info',
  idle: 'bg-muted-foreground/40',
};

const pulseClass: Record<StatusType, string> = {
  ok: '',
  warn: '',
  danger: '',
  active: 'animate-pulse',
  idle: '',
};

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-block h-2.5 w-2.5 rounded-full',
          dotColorMap[status],
          pulseClass[status],
        )}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
