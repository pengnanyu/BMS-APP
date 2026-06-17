import type { AlarmInfo } from '@/types/bms';
import { AlarmBadge } from '@/components/bms/shared/AlarmBadge';
import { EmptyState } from '@/components/bms/shared/EmptyState';

interface AlarmListCardProps {
  alarms: AlarmInfo[];
  onClear?: () => void;
}

export function AlarmListCard({ alarms, onClear }: AlarmListCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground">告警</h3>
        {alarms.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-[10px] text-bms-warn hover:text-bms-danger transition-colors"
          >
            清除
          </button>
        )}
      </div>

      {alarms.length === 0 ? (
        <EmptyState text="系统正常" />
      ) : (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {alarms.slice(0, 10).map(alarm => (
            <div key={alarm.id} className="flex items-start gap-2 text-xs">
              <AlarmBadge level={alarm.level} />
              <span className="flex-1 text-foreground">{alarm.message}</span>
              <span className="text-[10px] text-muted-foreground font-mono-num whitespace-nowrap">
                {new Date(alarm.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
