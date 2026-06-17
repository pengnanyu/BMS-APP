import { useState, useEffect } from 'react';
import { webBridge } from '@/platforms/web/lib/web-bridge';
import type { ConnectionStatus } from '@/shared/types/bridge';
import { cn } from '@/lib/utils';
import { WifiOff, Battery, BatteryCharging, Zap, Thermometer, Gauge } from 'lucide-react';

/** UI 内容区 - 占位展示（暂不加载外部 UI） */
export function UIContent() {
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');

  // 监听连接状态变化
  useEffect(() => {
    const unsubscribe = webBridge.onConnectionStatusChange((status) => {
      setConnStatus(status);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      {/* 连接状态横幅（错误时显示） */}
      {connStatus === 'error' && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-destructive/10 border-b border-destructive/20 px-4 py-1.5 flex items-center gap-2 animate-slide-down">
          <WifiOff className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="text-xs text-destructive font-medium">连接异常，请检查设备连接</span>
        </div>
      )}

      {/* 占位内容区 - 等待 UI 开发完成后替换为 iframe */}
      <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
        {/* 装饰性背景网格 */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 1px, transparent 1px),
              linear-gradient(90deg, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            color: 'var(--color-foreground)',
          }}
        />

        {/* 主内容 */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg">
          {/* Logo 大图标 */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-3">
            <img
              src="/aibms-logo.png"
              alt="AIBMS"
              className="w-full h-full object-contain"
            />
          </div>

          {/* 标题 */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              BMS 数据面板
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              连接设备后，UI 界面将在此处加载显示
            </p>
          </div>

          {/* 状态卡片 */}
          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            <StatusCard
              icon={<Battery className="w-4 h-4" />}
              label="电池状态"
              value="等待连接"
              muted
            />
            <StatusCard
              icon={<Zap className="w-4 h-4" />}
              label="电压 / 电流"
              value="-- V / -- A"
              muted
            />
            <StatusCard
              icon={<Thermometer className="w-4 h-4" />}
              label="温度"
              value="-- °C"
              muted
            />
            <StatusCard
              icon={<Gauge className="w-4 h-4" />}
              label="SOC"
              value="-- %"
              muted
            />
          </div>

          {/* 提示信息 */}
          <div className="w-full mt-2 rounded-lg border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">提示：</span>
              外部 UI 服务（ui.aibms.net）开发完成后，此占位区域将替换为 iframe 加载真实 UI。
              当前可通过顶部控制栏测试蓝牙/串口连接功能。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 状态卡片组件 */
function StatusCard({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5",
    )}>
      <div className="flex items-center gap-1.5">
        <span className={cn("w-4 h-4", muted ? "text-muted-foreground/40" : "text-primary")}>
          {icon}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-mono font-semibold",
        muted ? "text-muted-foreground/50" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
