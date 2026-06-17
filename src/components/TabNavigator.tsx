import type { TabKey } from '@/types/bms';
import { Battery, Settings, AlertTriangle, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabNavigatorProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  alarmCount?: number;
}

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'battery', label: '电池信息', icon: <Battery className="h-4 w-4" /> },
  { key: 'config', label: '参数配置', icon: <Settings className="h-4 w-4" /> },
  { key: 'alarm', label: '异常记录', icon: <AlertTriangle className="h-4 w-4" /> },
  { key: 'command', label: '指令下发', icon: <Terminal className="h-4 w-4" /> },
];

export function TabNavigator({ activeTab, onTabChange, alarmCount = 0 }: TabNavigatorProps) {
  return (
    <>
      <nav className="hidden sm:flex border-b border-border bg-card/80 backdrop-blur-sm">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors relative',
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.key === 'alarm' && alarmCount > 0 && (
              <span className="ml-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-bms-danger text-[9px] text-white font-mono-num px-1">
                {alarmCount > 99 ? '99+' : alarmCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors relative',
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              <span className="relative">
                {tab.icon}
                {tab.key === 'alarm' && alarmCount > 0 && (
                  <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] flex items-center justify-center rounded-full bg-bms-danger text-[8px] text-white font-mono-num px-0.5">
                    {alarmCount > 99 ? '99+' : alarmCount}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
