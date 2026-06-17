// ==================== BMS 仪表盘主页面 ====================

import { useBMS } from '@/lib/bms-store';
import { SOCGauge } from '@/components/bms/SOCGauge';
import { CellVoltageChart } from '@/components/bms/CellVoltageChart';
import { DataCard } from '@/components/bms/DataCard';
import { AlarmPanel } from '@/components/bms/AlarmPanel';
import { GPSPanel } from '@/components/bms/GPSPanel';
import { ConnectionBar } from '@/components/bms/ConnectionBar';
import { HistoryChart } from '@/components/bms/HistoryChart';
import { TemperatureGrid } from '@/components/bms/TemperatureGrid';
import { DeviceInfoPanel } from '@/components/bms/DeviceInfoPanel';
import {
  Zap,
  Battery,
  Thermometer,
  Gauge,
  Activity,
  RotateCcw,
  Clock,
  BarChart3,
  Satellite,
  Bell,
  Info,
  Play,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function Dashboard() {
  const {
    batteryData,
    lastUpdateTime,
    isDemoMode,
    startDemoMode,
    stopDemoMode,
    unacknowledgedCount,
    dispatch,
  } = useBMS();

  const isConnected = lastUpdateTime > 0;
  const secondsAgo = isConnected ? Math.round((Date.now() - lastUpdateTime) / 1000) : -1;

  // 电流方向判断
  const currentDirection = batteryData
    ? batteryData.current > 0 ? '充电' : batteryData.current < 0 ? '放电' : '静置'
    : '';

  const currentColor = batteryData
    ? batteryData.current > 0 ? 'ok' : batteryData.current < 0 ? 'warn' : 'default'
    : 'default' as const;

  return (
    <div className="min-h-screen bg-background grid-lines relative overflow-hidden">
      {/* 扫描线装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-px bg-primary/10 animate-scan-line" />
      </div>

      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[1920px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-cyan">
                <Battery className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  BMS <span className="text-primary">Monitor</span>
                </h1>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                  Battery Management System
                </p>
              </div>
            </div>

            {/* 状态指示 */}
            <div className="flex items-center gap-4">
              {/* 更新时间 */}
              {isConnected && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono-num">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {secondsAgo < 2 ? (
                      <span className="text-bms-ok animate-pulse">● 实时</span>
                    ) : (
                      `${secondsAgo}s 前`
                    )}
                  </span>
                </div>
              )}

              {/* 告警指示 */}
              {unacknowledgedCount > 0 && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-bms-danger animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-bms-danger rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                  </span>
                </div>
              )}

              {/* Demo 模式切换 */}
              <button
                onClick={isDemoMode ? stopDemoMode : startDemoMode}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all font-mono-num',
                  isDemoMode
                    ? 'bg-bms-ok/10 border-bms-ok/50 text-bms-ok hover:bg-bms-ok/20'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {isDemoMode ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isDemoMode ? '停止演示' : '演示模式'}
              </button>
            </div>
          </div>

          {/* 连接栏 */}
          <div className="mt-3">
            <ConnectionBar />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-[1920px] mx-auto p-4 space-y-4">
        {/* 核心指标行 */}
        {batteryData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <DataCard
              label="总电压"
              value={batteryData.totalVoltage.toFixed(2)}
              unit="V"
              icon={<Zap className="w-4 h-4" />}
              color="info"
              flash
            />
            <DataCard
              label="电流"
              value={Math.abs(batteryData.current).toFixed(1)}
              unit={`A ${currentDirection}`}
              icon={<Activity className="w-4 h-4" />}
              color={currentColor}
              flash
            />
            <DataCard
              label="功率"
              value={Math.abs(batteryData.power).toFixed(0)}
              unit="W"
              icon={<Gauge className="w-4 h-4" />}
              flash
            />
            <DataCard
              label="剩余容量"
              value={batteryData.remainingCapacity.toFixed(1)}
              unit="Ah"
              icon={<Battery className="w-4 h-4" />}
              color="ok"
            />
            <DataCard
              label="最高温度"
              value={batteryData.maxCellTemp.toFixed(1)}
              unit="°C"
              icon={<Thermometer className="w-4 h-4" />}
              color={batteryData.maxCellTemp > 45 ? 'danger' : batteryData.maxCellTemp > 35 ? 'warn' : 'ok'}
            />
            <DataCard
              label="SOH"
              value={batteryData.soh}
              unit="%"
              icon={<RotateCcw className="w-4 h-4" />}
              color={batteryData.soh > 80 ? 'ok' : batteryData.soh > 60 ? 'warn' : 'danger'}
            />
          </div>
        )}

        {/* 主面板区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左侧：SOC + 电芯 */}
          <div className="lg:col-span-4 space-y-4">
            {/* SOC 仪表盘 */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
              <SOCGauge />
              {batteryData && (
                <div className="mt-4 grid grid-cols-3 gap-4 w-full text-center text-xs font-mono-num">
                  <div>
                    <div className="text-muted-foreground">最低电压</div>
                    <div className="text-bms-cell-min text-lg font-bold">
                      {(batteryData.minCellVoltage / 1000).toFixed(3)}
                    </div>
                    <div className="text-muted-foreground">V</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均电压</div>
                    <div className="text-foreground text-lg font-bold">
                      {(batteryData.avgCellVoltage / 1000).toFixed(3)}
                    </div>
                    <div className="text-muted-foreground">V</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">最高电压</div>
                    <div className="text-bms-cell-max text-lg font-bold">
                      {(batteryData.maxCellVoltage / 1000).toFixed(3)}
                    </div>
                    <div className="text-muted-foreground">V</div>
                  </div>
                </div>
              )}
            </div>

            {/* 电芯电压 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium uppercase tracking-wider">电芯电压</h3>
              </div>
              <CellVoltageChart />
            </div>
          </div>

          {/* 中间：温度 + 告警 + 设备信息 */}
          <div className="lg:col-span-4 space-y-4">
            {/* 温度网格 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="w-4 h-4 text-bms-danger" />
                <h3 className="text-sm font-medium uppercase tracking-wider">电芯温度</h3>
              </div>
              <TemperatureGrid />
            </div>

            {/* 告警面板 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-bms-warn" />
                <h3 className="text-sm font-medium uppercase tracking-wider">
                  告警
                  {unacknowledgedCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-bms-danger/20 text-bms-danger rounded text-[10px]">
                      {unacknowledgedCount}
                    </span>
                  )}
                </h3>
                {unacknowledgedCount > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_ALARMS' })}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    全部清除
                  </button>
                )}
              </div>
              <AlarmPanel />
            </div>

            {/* 设备信息 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium uppercase tracking-wider">设备信息</h3>
              </div>
              <DeviceInfoPanel />
            </div>
          </div>

          {/* 右侧：历史图表 + GPS */}
          <div className="lg:col-span-4 space-y-4">
            {/* 历史数据图表 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium uppercase tracking-wider">历史数据</h3>
              </div>
              <HistoryChart />
            </div>

            {/* GPS 面板 */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Satellite className="w-4 h-4 text-bms-info" />
                <h3 className="text-sm font-medium uppercase tracking-wider">GPS 定位</h3>
              </div>
              <GPSPanel />
            </div>
          </div>
        </div>

        {/* 无数据提示 */}
        {!isConnected && !isDemoMode && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center">
              <Battery className="w-10 h-10 opacity-30" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">未连接设备</p>
              <p className="text-sm max-w-md">
                请通过蓝牙、串口或 MQTT 连接 BMS 设备，或开启演示模式查看界面效果。
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 底部状态栏 */}
      <footer className="border-t border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-[1920px] mx-auto px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono-num">
          <span>BMS Monitor v1.0.0</span>
          <span>
            {isConnected && batteryData
              ? `电芯: ${batteryData.cells.length}S | 压差: ${(batteryData.maxCellVoltage - batteryData.minCellVoltage).toFixed(0)}mV`
              : '等待连接...'}
          </span>
          <span>{format(Date.now(), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</span>
        </div>
      </footer>
    </div>
  );
}
