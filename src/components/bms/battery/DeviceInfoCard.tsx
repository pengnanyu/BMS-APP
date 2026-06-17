interface DeviceInfoCardProps {
  cellCount: number;
  voltageDiff: number;
  avgCellVoltage: number;
  nominalCapacity: number;
}

export function DeviceInfoCard({ cellCount, voltageDiff, avgCellVoltage, nominalCapacity }: DeviceInfoCardProps) {
  const items = [
    { label: '电芯数', value: `${cellCount} 串` },
    { label: '压差', value: `${voltageDiff} mV`, warn: voltageDiff > 100 },
    { label: '平均电压', value: `${(avgCellVoltage / 1000).toFixed(3)} V` },
    { label: '额定容量', value: `${nominalCapacity} Ah` },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">设备信息</h3>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-mono-num ${item.warn ? 'text-bms-warn' : 'text-foreground'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
