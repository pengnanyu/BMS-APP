import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type DataCardColor = 'default' | 'ok' | 'warn' | 'danger' | 'info';

interface DataCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  color?: DataCardColor;
  className?: string;
  flash?: boolean;
}

const colorMap: Record<DataCardColor, string> = {
  default: 'text-foreground',
  ok: 'text-bms-ok',
  warn: 'text-bms-warn',
  danger: 'text-bms-danger',
  info: 'text-bms-info',
};

const glowMap: Record<DataCardColor, string> = {
  default: '',
  ok: 'shadow-[0_0_8px_var(--color-bms-ok)]',
  warn: 'shadow-[0_0_8px_var(--color-bms-warn)]',
  danger: 'shadow-[0_0_8px_var(--color-bms-danger)]',
  info: 'shadow-[0_0_8px_var(--color-bms-info)]',
};

export function DataCard({ label, value, unit, icon, color = 'default', className, flash }: DataCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-3 flex flex-col gap-1',
        flash && glowMap[color],
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon && <span className="text-sm">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className={cn('font-mono-num text-lg font-semibold', colorMap[color])}>
        {value}
        {unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
      </div>
    </div>
  );
}
