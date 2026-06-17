interface AlarmStatsBarProps {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export function AlarmStatsBar({ criticalCount, warningCount, infoCount }: AlarmStatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-lg border border-bms-danger/30 bg-bms-danger/10 p-2 text-center">
        <div className="font-mono-num text-xl font-bold text-bms-danger">{criticalCount}</div>
        <div className="text-[10px] text-bms-danger/80">严重</div>
      </div>
      <div className="rounded-lg border border-bms-warn/30 bg-bms-warn/10 p-2 text-center">
        <div className="font-mono-num text-xl font-bold text-bms-warn">{warningCount}</div>
        <div className="text-[10px] text-bms-warn/80">警告</div>
      </div>
      <div className="rounded-lg border border-bms-info/30 bg-bms-info/10 p-2 text-center">
        <div className="font-mono-num text-xl font-bold text-bms-info">{infoCount}</div>
        <div className="text-[10px] text-bms-info/80">信息</div>
      </div>
    </div>
  );
}
