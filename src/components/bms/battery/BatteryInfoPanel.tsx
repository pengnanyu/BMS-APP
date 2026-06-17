import { useBatteryData } from '@/hooks/useBatteryData';
import { useAlarmData } from '@/hooks/useAlarmData';
import { bmsManager } from '@/lib/bms-manager';
import { SOCVoltageCurrentCard } from '@/components/bms/battery/SOCVoltageCurrentCard';
import { VoltageCurrentChartCard } from '@/components/bms/battery/VoltageCurrentChartCard';
import { CellVoltageCard } from '@/components/bms/battery/CellVoltageCard';
import { TemperatureGridCard } from '@/components/bms/battery/TemperatureGridCard';
import { DeviceInfoCard } from '@/components/bms/battery/DeviceInfoCard';
import { StatusIndicatorCard } from '@/components/bms/battery/StatusIndicatorCard';
import { AlarmListCard } from '@/components/bms/battery/AlarmListCard';
import { EmptyState } from '@/components/bms/shared/EmptyState';

export function BatteryInfoPanel() {
  const { batteryData, chartData, isLoading } = useBatteryData();
  const { alarms, clearAlarms } = useAlarmData();

  if (isLoading && !batteryData) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState text="等待电池数据..." />
      </div>
    );
  }

  if (!batteryData) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState text="等待电池数据..." />
      </div>
    );
  }

  const deviceInfo = bmsManager.getDeviceInfo();

  return (
    <div className="space-y-3 p-3 overflow-y-auto h-full">
      <SOCVoltageCurrentCard
        soc={batteryData.soc}
        totalVoltage={batteryData.totalVoltage}
        current={batteryData.current}
        power={batteryData.power}
        remainingCapacity={batteryData.remainingCapacity}
        soh={batteryData.soh}
        cycleCount={batteryData.cycleCount}
        maxCellTemp={batteryData.maxCellTemp}
        minCellTemp={batteryData.minCellTemp}
      />

      <VoltageCurrentChartCard data={chartData} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CellVoltageCard cells={batteryData.cells} />
        <TemperatureGridCard cells={batteryData.cells} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DeviceInfoCard
          cellCount={deviceInfo.cellCount}
          voltageDiff={deviceInfo.voltageDiff}
          avgCellVoltage={deviceInfo.avgCellVoltage}
          nominalCapacity={deviceInfo.nominalCapacity}
        />
        <StatusIndicatorCard
          soc={batteryData.soc}
          maxCellTemp={batteryData.maxCellTemp}
          voltageDiff={deviceInfo.voltageDiff}
          current={batteryData.current}
        />
        <AlarmListCard alarms={alarms} onClear={clearAlarms} />
      </div>
    </div>
  );
}
