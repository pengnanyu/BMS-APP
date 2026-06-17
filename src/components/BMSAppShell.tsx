import { useState } from 'react';
import type { TabKey } from '@/types/bms';
import { TabNavigator } from '@/components/TabNavigator';
import { BatteryInfoPanel } from '@/components/bms/battery/BatteryInfoPanel';
import { ParamConfigPanel } from '@/components/bms/config/ParamConfigPanel';
import { AlarmInfoPanel } from '@/components/bms/alarm/AlarmInfoPanel';
import { CommandPlaceholder } from '@/components/bms/command/CommandPlaceholder';
import { useAlarmData } from '@/hooks/useAlarmData';

export function BMSAppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>('battery');
  const { alarms } = useAlarmData();

  const renderPanel = () => {
    switch (activeTab) {
      case 'battery':
        return <BatteryInfoPanel />;
      case 'config':
        return <ParamConfigPanel />;
      case 'alarm':
        return <AlarmInfoPanel />;
      case 'command':
        return <CommandPlaceholder />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TabNavigator
        activeTab={activeTab}
        onTabChange={setActiveTab}
        alarmCount={alarms.length}
      />
      <div className="flex-1 overflow-hidden">
        {renderPanel()}
      </div>
    </div>
  );
}
