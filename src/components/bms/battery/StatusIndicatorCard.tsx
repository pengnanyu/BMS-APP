import { StatusDot } from '@/components/bms/shared/StatusDot';

interface StatusIndicatorCardProps {
  soc: number;
  maxCellTemp: number;
  voltageDiff: number;
  current: number;
}

export function StatusIndicatorCard({ soc, maxCellTemp, voltageDiff, current }: StatusIndicatorCardProps) {
  const socStatus = soc > 20 ? 'ok' as const : 'danger' as const;
  const socLabel = soc > 20 ? 'SOC 正常' : 'SOC 过低';

  const tempStatus = maxCellTemp < 45 ? 'ok' as const : 'danger' as const;
  const tempLabel = maxCellTemp < 45 ? '温度正常' : '温度过高';

  const diffStatus = voltageDiff < 100 ? 'ok' as const : 'warn' as const;
  const diffLabel = voltageDiff < 100 ? '压差正常' : '压差过大';

  const currentStatus = current !== 0 ? 'active' as const : 'idle' as const;
  const currentLabel = current > 0 ? '充电中' : current < 0 ? '放电中' : '静置';

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-3">状态指示</h3>
      <div className="grid grid-cols-2 gap-2">
        <StatusDot status={socStatus} label={socLabel} />
        <StatusDot status={tempStatus} label={tempLabel} />
        <StatusDot status={diffStatus} label={diffLabel} />
        <StatusDot status={currentStatus} label={currentLabel} />
      </div>
    </div>
  );
}
