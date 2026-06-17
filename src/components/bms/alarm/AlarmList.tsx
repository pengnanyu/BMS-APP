import type { AlarmInfo } from '@/types/bms';
import { AlarmBadge } from '@/components/bms/shared/AlarmBadge';
import { EmptyState } from '@/components/bms/shared/EmptyState';

interface AlarmListProps {
  alarms: AlarmInfo[];
  emptyText?: string;
}

export function AlarmList({ alarms, emptyText = '暂无异常记录' }: AlarmListProps) {
  if (alarms.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="space-y-1.5">
      {alarms.map(alarm => (
        <div
          key={alarm.id}
          className="flex items-start gap-2 rounded-md border border-border bg-card p-2.5"
        >
          <AlarmBadge level={alarm.level} />
          <span className="flex-1 text-xs text-foreground">{alarm.message}</span>
          <span className="text-[10px] text-muted-foreground font-mono-num whitespace-nowrap">
            {new Date(alarm.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
      ))}
    </div>
  );
}
