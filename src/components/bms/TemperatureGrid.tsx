// ==================== 温度可视化 ====================

import { useBMS } from '@/lib/bms-store';

export function TemperatureGrid() {
  const { batteryData } = useBMS();
  const cells = batteryData?.cells ?? [];

  if (cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        等待温度数据...
      </div>
    );
  }

  // 温度 → 颜色映射
  const getTempColor = (temp: number): string => {
    if (temp < 20) return 'bg-temp-cool-bg text-temp-cool';
    if (temp < 30) return 'bg-temp-normal-bg text-temp-normal';
    if (temp < 40) return 'bg-temp-warm-bg text-temp-warm';
    if (temp < 50) return 'bg-temp-hot-bg text-temp-hot';
    return 'bg-temp-danger-bg text-temp-danger';
  };

  // 网格布局（每行最多 8 个）
  const cols = Math.min(cells.length, 8);

  return (
    <div className="space-y-2">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`rounded-lg p-2 text-center border border-border/50 transition-all duration-500 ${getTempColor(cell.temperature)}`}
          >
            <div className="text-[10px] opacity-70 font-mono-num">#{cell.id}</div>
            <div className="text-sm font-bold font-mono-num">{cell.temperature.toFixed(1)}°</div>
          </div>
        ))}
      </div>

      {/* 温度图例 */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono-num justify-center">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-temp-cool-dot" />&lt;20°C</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-temp-normal-dot" />20-30</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-temp-warm-dot" />30-40</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-temp-hot-dot" />40-50</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-temp-danger-dot" />&gt;50</span>
      </div>
    </div>
  );
}
