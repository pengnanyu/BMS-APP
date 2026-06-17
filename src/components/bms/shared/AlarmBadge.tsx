import { cn } from '@/lib/utils';

type AlarmLevel = 'critical' | 'warning' | 'info';

interface AlarmBadgeProps {
  level: AlarmLevel;
}

const levelConfig: Record<AlarmLevel, { label: string; className: string }> = {
  critical: {
    label: '严重',
    className: 'bg-bms-danger/15 text-bms-danger border-bms-danger/30',
  },
  warning: {
    label: '警告',
    className: 'bg-bms-warn/15 text-bms-warn border-bms-warn/30',
  },
  info: {
    label: '信息',
    className: 'bg-bms-info/15 text-bms-info border-bms-info/30',
  },
};

export function AlarmBadge({ level }: AlarmBadgeProps) {
  const config = levelConfig[level];
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
