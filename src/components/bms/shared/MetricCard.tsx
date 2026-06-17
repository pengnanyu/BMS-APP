import { cn } from '@/lib/utils';

type MetricCardColor = 'default' | 'ok' | 'warn' | 'danger' | 'info';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: MetricCardColor;
}

const colorMap: Record<MetricCardColor, string> = {
  default: 'text-foreground',
  ok: 'text-bms-ok',
  warn: 'text-bms-warn',
  danger: 'text-bms-danger',
  info: 'text-bms-info',
};

export function MetricCard({ label, value, unit, color = 'default' }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-1.5">
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>
      <span className={cn('font-mono-num text-sm font-semibold', colorMap[color])}>
        {value}
        {unit && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}
