import { useState, useEffect, useCallback } from 'react';
import { bmsManager } from '@/lib/bms-manager';
import type { AlarmInfo } from '@/types/bms';

interface AlarmDataState {
  alarms: AlarmInfo[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  clearAlarms: () => void;
}

export function useAlarmData(): AlarmDataState {
  const [alarms, setAlarms] = useState<AlarmInfo[]>([]);

  useEffect(() => {
    const handleAlarms = (newAlarms: AlarmInfo[]) => {
      setAlarms([...newAlarms]);
    };

    bmsManager.onAlarms(handleAlarms);

    return () => {
      bmsManager.offAlarms(handleAlarms);
    };
  }, []);

  const clearAlarms = useCallback(() => {
    bmsManager.clearAlarms();
    setAlarms([]);
  }, []);

  const criticalCount = alarms.filter(a => a.level === 'critical').length;
  const warningCount = alarms.filter(a => a.level === 'warning').length;
  const infoCount = alarms.filter(a => a.level === 'info').length;

  return { alarms, criticalCount, warningCount, infoCount, clearAlarms };
}
