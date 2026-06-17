// ==================== 异常记录 Tab ====================
// 动态展示异常信息（根据协议项动态调整）

import { useState, useEffect } from 'react';
import { bmsManager } from '@/lib/bms-manager';
import type { AlarmInfo } from '@/lib/bms-manager';
import { cn } from '@/lib/utils';

export function AlarmRecordPanel() {
  const [alarms, setAlarms] = useState<AlarmInfo[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    bmsManager.onAlarms(setAlarms);
    return () => bmsManager.offAlarms(setAlarms);
  }, []);

  const filtered = filter === 'all' ? alarms : alarms.filter(a => a.level === filter);

  const levelStyle: Record<string, { bg: string; text: string; border: string; label: string }> = {
    critical: { bg: 'bg-bms-danger/10', text: 'text-bms-danger', border: 'border-bms-danger/30', label: '严重' },
    warning: { bg: 'bg-bms-warn/10', text: 'text-bms-warn', border: 'border-bms-warn/30', label: '警告' },
    info: { bg: 'bg-bms-info/10', text: 'text-bms-info', border: 'border-bms-info/30', label: '信息' },
  };

  const filterOptions = [
    { value: 'all' as const, label: '全部', count: alarms.length },
    { value: 'critical' as const, label: '严重', count: alarms.filter(a => a.level === 'critical').length },
    { value: 'warning' as const, label: '警告', count: alarms.filter(a => a.level === 'warning').length },
    { value: 'info' as const, label: '信息', count: alarms.filter(a => a.level === 'info').length },
  ];

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* 过滤栏 */}
      <div className="flex items-center gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md border transition-all',
              filter === opt.value
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
            {opt.count > 0 && (
              <span className="ml-1 text-[10px] opacity-60">{opt.count}</span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {alarms.length > 0 && (
          <button
            onClick={() => bmsManager.clearAlarms()}
            className="px-3 py-1.5 text-xs bg-bms-danger/10 text-bms-danger border border-bms-danger/30 rounded-md hover:bg-bms-danger/20 transition-colors"
          >
            全部清除
          </button>
        )}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold font-mono-num text-bms-danger">
            {alarms.filter(a => a.level === 'critical').length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">严重告警</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold font-mono-num text-bms-warn">
            {alarms.filter(a => a.level === 'warning').length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">警告</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold font-mono-num text-bms-info">
            {alarms.filter(a => a.level === 'info').length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">信息</div>
        </div>
      </div>

      {/* 告警列表 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <span className="text-3xl opacity-30">✓</span>
          <span className="text-sm">暂无异常记录</span>
        </div>
      ) : (
        <div className="space-y-2">
          {[...filtered].reverse().map((alarm) => {
            const style = levelStyle[alarm.level];
            return (
              <div key={alarm.id} className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-all',
                style.bg, style.border
              )}>
                <div className={cn('shrink-0 px-2 py-0.5 rounded text-[10px] font-bold', style.text, 'bg-background/50')}>
                  {style.label}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-sm font-medium', style.text)}>{alarm.message}</div>
                  <div className="text-[10px] text-muted-foreground font-mono-num mt-0.5">
                    代码: {alarm.code} | {new Date(alarm.timestamp).toLocaleString('zh-CN', { hour12: false })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
