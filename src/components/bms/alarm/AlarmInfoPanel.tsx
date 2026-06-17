import { useState, useMemo } from 'react';
import { useAlarmData } from '@/hooks/useAlarmData';
import { AlarmStatsBar } from '@/components/bms/alarm/AlarmStatsBar';
import { AlarmFilterBar } from '@/components/bms/alarm/AlarmFilterBar';
import { AlarmList } from '@/components/bms/alarm/AlarmList';
import type { AlarmInfo } from '@/types/bms';

type AlarmFilterType = 'all' | 'critical' | 'warning' | 'info';

export function AlarmInfoPanel() {
  const { alarms, criticalCount, warningCount, infoCount, clearAlarms } = useAlarmData();
  const [filter, setFilter] = useState<AlarmFilterType>('all');

  const filteredAlarms = useMemo(() => {
    if (filter === 'all') return alarms;
    return alarms.filter((a: AlarmInfo) => a.level === filter);
  }, [alarms, filter]);

  return (
    <div className="p-3 space-y-3 h-full overflow-y-auto">
      <AlarmFilterBar
        filter={filter}
        onFilterChange={setFilter}
        counts={{
          critical: criticalCount,
          warning: warningCount,
          info: infoCount,
          total: alarms.length,
        }}
        onClearAll={clearAlarms}
      />

      <AlarmStatsBar
        criticalCount={criticalCount}
        warningCount={warningCount}
        infoCount={infoCount}
      />

      <AlarmList alarms={filteredAlarms} />
    </div>
  );
}
