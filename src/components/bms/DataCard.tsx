// ==================== 数据指标卡片 ====================

import { cn } from '@/lib/utils';

interface DataCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'ok' | 'warn' | 'danger' | 'info';
  className?: string;
  flash?: boolean;
}

export function DataCard({ label, value, unit, icon, color = 'default', className, flash }: DataCardProps) {
  const colorClasses: Record<string, string> = {
    default: 'text-foreground',
    ok: 'text-bms-ok',
    warn: 'text-bms-warn',
    danger: 'text-bms-danger',
    info: 'text-bms-info',
  };

  const glowClasses: Record<string, string> = {
    default: '',
    ok: 'glow-cyan',
    warn: 'glow-amber',
    danger: 'glow-red',
    info: 'glow-cyan',
  };

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-3 transition-all duration-300',
        flash && 'animate-data-flash',
        glowClasses[color],
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold font-mono-num', colorClasses[color])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
