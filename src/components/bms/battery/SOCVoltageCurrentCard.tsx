import { SOCGauge } from '@/components/bms/shared/SOCGauge';
import { MetricCard } from '@/components/bms/shared/MetricCard';

interface SOCVoltageCurrentCardProps {
  soc: number;
  totalVoltage: number;
  current: number;
  power?: number;
  remainingCapacity?: number;
  soh?: number;
  cycleCount?: number;
  maxCellTemp?: number;
  minCellTemp?: number;
}

export function SOCVoltageCurrentCard({
  soc,
  totalVoltage,
  current,
  power,
  remainingCapacity,
  soh,
  cycleCount,
  maxCellTemp,
  minCellTemp,
}: SOCVoltageCurrentCardProps) {
  const currentDirection = current > 0 ? '充电' : current < 0 ? '放电' : '静置';
  const currentColor = current > 0 ? 'ok' as const : current < 0 ? 'warn' as const : 'default' as const;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <SOCGauge value={soc} />

        <div className="flex-1 grid grid-cols-3 gap-1">
          <div className="col-span-3 flex items-baseline gap-3 mb-1">
            <div>
              <span className="text-[10px] text-muted-foreground">总电压</span>
              <div className="font-mono-num text-xl font-semibold text-bms-info">
                {totalVoltage.toFixed(2)}
                <span className="text-xs font-normal text-muted-foreground ml-1">V</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">电流</span>
              <div className="font-mono-num text-xl font-semibold">
                <span className={currentColor === 'ok' ? 'text-bms-ok' : currentColor === 'warn' ? 'text-bms-warn' : 'text-muted-foreground'}>
                  {Math.abs(current).toFixed(1)}
                </span>
                <span className="text-xs font-normal text-muted-foreground ml-1">A</span>
                <span className={`ml-1.5 text-[10px] font-medium px-1 py-0.5 rounded ${
                  current > 0 ? 'bg-bms-ok/15 text-bms-ok' :
                  current < 0 ? 'bg-bms-warn/15 text-bms-warn' :
                  'bg-muted/30 text-muted-foreground'
                }`}>
                  {currentDirection}
                </span>
              </div>
            </div>
          </div>

          {power !== undefined && <MetricCard label="功率" value={power.toFixed(1)} unit="W" color="info" />}
          {remainingCapacity !== undefined && <MetricCard label="剩余容量" value={remainingCapacity.toFixed(1)} unit="Ah" />}
          {soh !== undefined && <MetricCard label="SOH" value={soh} unit="%" color={soh > 80 ? 'ok' : 'warn'} />}
          {cycleCount !== undefined && <MetricCard label="循环次数" value={cycleCount} />}
          {maxCellTemp !== undefined && <MetricCard label="最高温度" value={maxCellTemp.toFixed(1)} unit="°C" color={maxCellTemp > 45 ? 'danger' : maxCellTemp > 35 ? 'warn' : 'default'} />}
          {minCellTemp !== undefined && <MetricCard label="最低温度" value={minCellTemp.toFixed(1)} unit="°C" />}
        </div>
      </div>
    </div>
  );
}
