import { EmptyState } from '@/components/bms/shared/EmptyState';
import type { CellInfo } from '@/lib/bms-manager';

interface TemperatureGridCardProps {
  cells: CellInfo[];
}

function getTempColor(temp: number): string {
  if (temp < 25) return 'var(--color-temp-cool, #3b82f6)';
  if (temp < 35) return 'var(--color-temp-normal, #22c55e)';
  if (temp < 45) return 'var(--color-temp-warm, #eab308)';
  return 'var(--color-temp-danger, #ef4444)';
}

function getTempBg(temp: number): string {
  if (temp < 25) return 'rgba(59,130,246,0.12)';
  if (temp < 35) return 'rgba(34,197,94,0.12)';
  if (temp < 45) return 'rgba(234,179,8,0.12)';
  return 'rgba(239,68,68,0.12)';
}

export function TemperatureGridCard({ cells }: TemperatureGridCardProps) {
  if (cells.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">温度</h3>
        <EmptyState text="等待温度数据..." />
      </div>
    );
  }

  const maxCols = Math.min(cells.length, 8);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">温度</h3>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
      >
        {cells.map(cell => (
          <div
            key={cell.id}
            className="flex flex-col items-center rounded px-1.5 py-1.5"
            style={{ backgroundColor: getTempBg(cell.temperature) }}
          >
            <span className="text-[9px] text-muted-foreground">#{cell.id}</span>
            <span
              className="font-mono-num text-xs font-semibold"
              style={{ color: getTempColor(cell.temperature) }}
            >
              {cell.temperature.toFixed(1)}°C
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
