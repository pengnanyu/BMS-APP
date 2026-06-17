// ==================== 设备信息面板 ====================

import { useBMS } from '@/lib/bms-store';
import { Cpu, HardDrive, Tag, Layers, Zap, Battery } from 'lucide-react';

export function DeviceInfoPanel() {
  const { batteryData, deviceInfo } = useBMS();

  const infoItems = [
    { icon: <Tag className="w-3.5 h-3.5" />, label: '制造商', value: deviceInfo?.manufacturer || 'N/A' },
    { icon: <Cpu className="w-3.5 h-3.5" />, label: '型号', value: deviceInfo?.model || 'N/A' },
    { icon: <Layers className="w-3.5 h-3.5" />, label: '固件版本', value: deviceInfo?.firmwareVersion || 'N/A' },
    { icon: <HardDrive className="w-3.5 h-3.5" />, label: '序列号', value: deviceInfo?.serialNumber || 'N/A' },
    { icon: <Battery className="w-3.5 h-3.5" />, label: '额定容量', value: deviceInfo ? `${deviceInfo.nominalCapacity}Ah` : 'N/A' },
    { icon: <Zap className="w-3.5 h-3.5" />, label: '额定电压', value: deviceInfo ? `${deviceInfo.nominalVoltage}V` : 'N/A' },
    { icon: <Layers className="w-3.5 h-3.5" />, label: '电芯数量', value: deviceInfo?.cellCount ?? batteryData?.cells.length ?? 'N/A' },
  ];

  return (
    <div className="grid grid-cols-1 gap-1.5 text-xs">
      {infoItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2 py-1 px-2 rounded bg-card/30 border border-border/50">
          <span className="text-muted-foreground">{item.icon}</span>
          <span className="text-muted-foreground shrink-0 w-16">{item.label}</span>
          <span className="text-foreground font-mono-num truncate">{String(item.value)}</span>
        </div>
      ))}

      {/* 运行时信息 */}
      {batteryData && (
        <>
          <div className="flex items-center gap-2 py-1 px-2 rounded bg-card/30 border border-border/50 mt-2">
            <span className="text-muted-foreground"><Battery className="w-3.5 h-3.5" /></span>
            <span className="text-muted-foreground shrink-0 w-16">循环次数</span>
            <span className="text-foreground font-mono-num">{batteryData.cycleCount}</span>
          </div>
          <div className="flex items-center gap-2 py-1 px-2 rounded bg-card/30 border border-border/50">
            <span className="text-muted-foreground"><Zap className="w-3.5 h-3.5" /></span>
            <span className="text-muted-foreground shrink-0 w-16">总能量</span>
            <span className="text-foreground font-mono-num">{batteryData.totalEnergy.toFixed(2)} kWh</span>
          </div>
          <div className="flex items-center gap-2 py-1 px-2 rounded bg-card/30 border border-border/50">
            <span className="text-muted-foreground"><HardDrive className="w-3.5 h-3.5" /></span>
            <span className="text-muted-foreground shrink-0 w-16">SOH</span>
            <span className="text-foreground font-mono-num">{batteryData.soh}%</span>
          </div>
        </>
      )}
    </div>
  );
}
