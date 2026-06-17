import { cn } from '@/lib/utils';

interface SOCGaugeProps {
  value: number;
  size?: number;
  className?: string;
}

export function SOCGauge({ value, size, className }: SOCGaugeProps) {
  const gaugeSize = size ?? 140;
  const strokeWidth = gaugeSize * 0.08;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - percent / 100);

  const color = percent > 60 ? 'var(--color-bms-ok)' : percent > 20 ? 'var(--color-bms-warn)' : 'var(--color-bms-danger)';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={gaugeSize} height={gaugeSize} className="transform -rotate-90">
        <circle
          cx={gaugeSize / 2}
          cy={gaugeSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={gaugeSize / 2}
          cy={gaugeSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-num text-2xl sm:text-3xl font-bold" style={{ color }}>
          {Math.round(percent)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">%</span>
      </div>
    </div>
  );
}
