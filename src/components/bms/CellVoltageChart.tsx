// ==================== 电芯电压可视化 ====================

import { useBMS } from '@/lib/bms-store';

export function CellVoltageChart() {
  const { batteryData } = useBMS();
  const cells = batteryData?.cells ?? [];

  if (cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        等待电芯数据...
      </div>
    );
  }

  const minV = Math.min(...cells.map(c => c.voltage));
  const maxV = Math.max(...cells.map(c => c.voltage));
  const avgV = cells.reduce((a, b) => a + b.voltage, 0) / cells.length;
  const range = maxV - minV || 1;

  // 归一化高度百分比
  const getHeight = (v: number) => ((v - minV) / range) * 80 + 20;

  return (
    <div className="space-y-3">
      {/* 统计信息 */}
      <div className="flex justify-between text-xs font-mono-num">
        <span className="text-bms-cell-min">最低: {(minV / 1000).toFixed(3)}V</span>
        <span className="text-muted-foreground">平均: {(avgV / 1000).toFixed(3)}V</span>
        <span className="text-bms-cell-max">最高: {(maxV / 1000).toFixed(3)}V</span>
      </div>

      <div className="text-xs text-muted-foreground font-mono-num text-center">
        压差: <span className={range > 50 ? 'text-bms-danger' : 'text-bms-ok'}>
          {range.toFixed(0)}mV
        </span>
      </div>

      {/* 柱状图 */}
      <div className="flex items-end gap-[2px] h-32 px-1">
        {cells.map((cell) => {
          const isMin = cell.voltage === minV;
          const isMax = cell.voltage === maxV;
          const height = getHeight(cell.voltage);

          return (
            <div
              key={cell.id}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded px-2 py-1 text-xs font-mono-num opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                #{cell.id}: {(cell.voltage / 1000).toFixed(3)}V
              </div>

              {/* 柱体 */}
              <div
                className={`w-full rounded-t transition-all duration-500 ease-out cursor-pointer
                  ${isMin ? 'bg-bms-cell-min' : isMax ? 'bg-bms-cell-max' : 'bg-primary/60'}
                  group-hover:brightness-125
                `}
                style={{ height: `${height}%` }}
              />

              {/* 编号 */}
              <span className="text-[9px] text-muted-foreground font-mono-num">
                {cell.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
