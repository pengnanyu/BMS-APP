// ==================== SOC 仪表盘（荧光效果 + 加粗圆环）====================

import { cn } from '@/lib/utils';

interface SOCGaugeProps {
  value: number;
  size?: number;
}

export function SOCGauge({ value, size = 160 }: SOCGaugeProps) {
  const strokeWidth = 16;
  const radius = (size - strokeWidth - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (v: number) => {
    if (v > 60) return 'text-bms-ok';
    if (v > 20) return 'text-bms-warn';
    return 'text-bms-danger';
  };

  const getStroke = (v: number) => {
    if (v > 60) return 'hsl(140 70% 45%)';
    if (v > 20) return 'hsl(35 90% 55%)';
    return 'hsl(0 85% 55%)';
  };

  const getGlowColor = (v: number) => {
    if (v > 60) return 'hsla(140, 70%, 50%, 0.6)';
    if (v > 20) return 'hsla(35, 90%, 60%, 0.6)';
    return 'hsla(0, 85%, 60%, 0.6)';
  };

  const strokeColor = getStroke(value);
  const glowColor = getGlowColor(value);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      {/* SVG 层 */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 absolute inset-0"
      >
        <defs>
          {/* 荧光滤镜 — 柔和扩散 */}
          <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
            </feMerge>
          </filter>

          {/* 主环渐变 — 让颜色有微妙的深度 */}
          <linearGradient id={`grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* 背景轨道 — 完全透明融入背景 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-muted/20 dark:stroke-muted/25"
        />

        {/* 荧光外圈 — 纯光晕无实体边缘 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth + 8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#glow-${size})`}
          className="transition-all duration-700 ease-out"
        />

        {/* 主进度环 — 渐变填充 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#grad-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />

        {/* 内圈微光 — 增加深度感 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth - 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity="0.15"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* 中心文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <span className={cn('text-4xl font-bold font-mono-num', getColor(value))}>
          {value}
        </span>
        <span className="text-muted-foreground text-[10px] tracking-widest uppercase mt-0.5">
          SOC %
        </span>
      </div>
    </div>
  );
}
