// ==================== BMS 主 UI（三端共用）====================
// Tab 导航：电池信息 | 参数配置 | 异常记录 | 指令下发

import { useState, useCallback } from 'react';
import { BatteryInfoPanel } from './bms/BatteryInfoPanel';
import { ParamConfigPanel } from './bms/ParamConfigPanel';
import { AlarmRecordPanel } from './bms/AlarmRecordPanel';
import { CommandPanel } from './bms/CommandPanel';
import { cn } from '@/lib/utils';

type TabKey = 'battery' | 'config' | 'alarm' | 'command';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'battery', label: '电池信息', icon: '🔋' },
  { key: 'config', label: '参数配置', icon: '⚙' },
  { key: 'alarm', label: '异常记录', icon: '⚠' },
  { key: 'command', label: '指令下发', icon: '📡' },
];

export function BMSUI() {
  const [activeTab, setActiveTab] = useState<TabKey>('battery');

  const renderPanel = useCallback(() => {
    switch (activeTab) {
      case 'battery': return <BatteryInfoPanel />;
      case 'config': return <ParamConfigPanel />;
      case 'alarm': return <AlarmRecordPanel />;
      case 'command': return <CommandPanel />;
    }
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Tab 导航 */}
      <nav className="flex border-b border-border bg-card/50 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2',
              activeTab === tab.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-card'
            )}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* 面板内容 */}
      <div className="flex-1 overflow-hidden">
        {renderPanel()}
      </div>
    </div>
  );
}
