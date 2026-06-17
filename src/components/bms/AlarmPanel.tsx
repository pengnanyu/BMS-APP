// ==================== 告警面板 ====================

import { useBMS } from '@/lib/bms-store';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';

export function AlarmPanel() {
  const { alarms, dispatch } = useBMS();

  const levelConfig = {
    critical: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-bms-danger',
      bg: 'bg-bms-danger/10 border-bms-danger/30',
      label: '严重',
    },
    warning: {
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-bms-warn',
      bg: 'bg-bms-warn/10 border-bms-warn/30',
      label: '警告',
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      color: 'text-bms-info',
      bg: 'bg-bms-info/10 border-bms-info/30',
      label: '信息',
    },
  };

  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <Check className="w-8 h-8 text-bms-ok" />
        <span className="text-sm">系统正常，无告警</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {[...alarms].reverse().map((alarm) => {
        const config = levelConfig[alarm.level];
        return (
          <div
            key={alarm.id}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg border text-sm transition-all',
              config.bg,
              alarm.acknowledged && 'opacity-50'
            )}
          >
            <span className={config.color}>{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{alarm.message}</div>
              <div className="text-xs text-muted-foreground font-mono-num">
                {format(alarm.timestamp, 'HH:mm:ss', { locale: zhCN })}
                {alarm.value !== undefined && ` | 值: ${alarm.value}`}
                {alarm.threshold !== undefined && ` | 阈值: ${alarm.threshold}`}
              </div>
            </div>
            {!alarm.acknowledged && (
              <button
                onClick={() => dispatch({ type: 'ACKNOWLEDGE_ALARM', payload: alarm.id })}
                className="px-2 py-1 text-xs bg-background/50 hover:bg-background rounded border border-border transition-colors shrink-0"
              >
                确认
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
