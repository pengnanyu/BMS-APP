import { EmptyState } from '@/components/bms/shared/EmptyState';
import type { CellInfo } from '@/lib/bms-manager';

interface CellVoltageCardProps {
  cells: CellInfo[];
}

export function CellVoltageCard({ cells }: CellVoltageCardProps) {
  if (cells.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">单体电压</h3>
        <EmptyState text="等待电芯数据..." />
      </div>
    );
  }

  const voltages = cells.map(c => c.voltage);
  const minV = Math.min(...voltages);
  const maxV = Math.max(...voltages);
  const diff = maxV - minV;
  const range = maxV - minV || 1;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground">单体电压</h3>
        <div className="flex gap-3 text-[10px] font-mono-num">
          <span className="text-bms-info">最低 {(minV / 1000).toFixed(3)}V</span>
          <span className="text-bms-warn">最高 {(maxV / 1000).toFixed(3)}V</span>
          <span className={diff > 100 ? 'text-bms-danger' : 'text-muted-foreground'}>压差 {diff}mV</span>
        </div>
      </div>

      <div className="flex items-end gap-[2px] h-[120px]">
        {cells.map(cell => {
          const isMin = cell.voltage === minV;
          const isMax = cell.voltage === maxV;
          const height = ((cell.voltage - minV) / range) * 80 + 20;

          return (
            <div key={cell.id} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{
                  height: `${height}%`,
                  backgroundColor: isMin
                    ? 'var(--color-bms-info)'
                    : isMax
                      ? 'var(--color-bms-warn)'
                      : 'var(--color-bms-info)',
                  opacity: isMin || isMax ? 1 : 0.4,
                }}
              />
              <span className="text-[8px] text-muted-foreground font-mono-num">{cell.id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
