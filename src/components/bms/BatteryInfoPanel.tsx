// ==================== 电池信息 Tab ====================
// SOC + 总电压电流 + 曲线 + 单体电压 + 温度 + 设备信息 + 状态 + 告警

import { useState, useEffect, useCallback, useRef } from 'react';
import { bmsManager } from '@/lib/bms-manager';
import type { BatteryData, AlarmInfo, ChartPoint } from '@/lib/bms-manager';
import { SOCGauge } from './SOCGauge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// ==================== 子组件 ====================

/** SOC + 电压 + 电流 合并容器 — 左 SOC 右上下两行 */
function SOCVoltageCurrentCard({ data, direction }: { data: BatteryData; direction: string }) {
  const voltageColor = 'text-bms-info';
  const currentColor =
    data.current > 0 ? 'text-bms-ok' : data.current < 0 ? 'text-bms-warn' : 'text-foreground';

  return (
    <div className="bg-card border border-border rounded-xl flex items-stretch overflow-hidden">
      {/* 左侧：SOC 仪表盘 — 无额外 padding，与容器无缝融合 */}
      <div className="shrink-0 flex items-center justify-center p-3">
        <SOCGauge value={data.soc} size={120} />
      </div>

      {/* 分隔线 */}
      <div className="w-px bg-border shrink-0" />

      {/* 右侧：上下两行 */}
      <div className="flex-1 flex flex-col justify-center gap-3 p-4 min-w-0">
        {/* 上行：总电压 */}
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">总电压</span>
          <span className={cn('text-2xl font-bold font-mono-num', voltageColor)}>
            {data.totalVoltage.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">V</span>
        </div>

        {/* 下行：电流 + 方向 */}
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">电流</span>
          <span className={cn('text-2xl font-bold font-mono-num', currentColor)}>
            {Math.abs(data.current).toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">A</span>
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
            data.current > 0
              ? 'bg-bms-ok/15 text-bms-ok'
              : data.current < 0
              ? 'bg-bms-warn/15 text-bms-warn'
              : 'bg-muted text-muted-foreground'
          )}>
            {direction}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 数据指标卡片 */
function MetricCard({ label, value, unit, color = 'default' }: {
  label: string; value: string | number; unit?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    default: 'text-foreground',
    ok: 'text-bms-ok',
    warn: 'text-bms-warn',
    danger: 'text-bms-danger',
    info: 'text-bms-info',
  };

  return (
    <div className="bg-card/50 border border-border rounded-lg p-3 text-center">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline justify-center gap-1">
        <span className={cn('text-xl font-bold font-mono-num', colors[color] || colors.default)}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

/** 单体电压柱状图 */
function CellVoltageChart({ cells }: { cells: BatteryData['cells'] }) {
  if (cells.length === 0) return <div className="text-xs text-muted-foreground text-center py-8">等待数据...</div>;

  const minV = Math.min(...cells.map(c => c.voltage));
  const maxV = Math.max(...cells.map(c => c.voltage));
  const range = maxV - minV || 1;
  const getHeight = (v: number) => ((v - minV) / range) * 70 + 30;

  // 使用内联颜色确保双主题下都可见
  const getBarColor = (isMin: boolean, isMax: boolean) => {
    if (isMin) return 'hsl(180, 100%, 38%)';
    if (isMax) return 'hsl(35, 85%, 50%)';
    return 'hsl(180, 100%, 42%)';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono-num">
        <span style={{ color: 'hsl(180, 100%, 38%)' }}>最低: {(minV / 1000).toFixed(3)}V</span>
        <span className="text-muted-foreground">压差: {range.toFixed(0)}mV</span>
        <span style={{ color: 'hsl(35, 85%, 50%)' }}>最高: {(maxV / 1000).toFixed(3)}V</span>
      </div>
      <div className="flex items-end gap-[2px] h-28">
        {cells.map((cell) => {
          const isMin = cell.voltage === minV;
          const isMax = cell.voltage === maxV;
          return (
            <div key={cell.id} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${getHeight(cell.voltage)}%`,
                  backgroundColor: getBarColor(isMin, isMax),
                  opacity: (isMin || isMax) ? 1 : 0.7,
                }}
              />
              <span className="text-[8px] text-muted-foreground">{cell.id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 温度网格 */
function TemperatureGrid({ cells }: { cells: BatteryData['cells'] }) {
  if (cells.length === 0) return <div className="text-xs text-muted-foreground text-center py-8">等待数据...</div>;

  const getTempColor = (t: number) => {
    if (t < 25) return 'bg-bms-info/15 text-bms-info';
    if (t < 35) return 'bg-bms-ok/15 text-bms-ok';
    if (t < 45) return 'bg-bms-warn/15 text-bms-warn';
    return 'bg-bms-danger/15 text-bms-danger';
  };

  const cols = Math.min(cells.length, 8);

  return (
    <div className="space-y-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cells.map((cell) => (
          <div key={cell.id} className={cn('rounded p-1.5 text-center border border-border/50 transition-all', getTempColor(cell.temperature))}>
            <div className="text-[8px] opacity-60">#{cell.id}</div>
            <div className="text-xs font-bold font-mono-num">{cell.temperature.toFixed(1)}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 电压电流曲线（主题自适应） */
function VoltageCurrentChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <div className="text-xs text-muted-foreground text-center py-8">等待数据...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="time" tick={{ className: 'fill-muted-foreground', fontSize: 9 }} tickLine={false} axisLine={{ className: 'stroke-border' }} />
        <YAxis yAxisId="left" tick={{ fill: 'hsl(180 100% 35%)', fontSize: 9 }} tickLine={false} axisLine={false}
          label={{ value: 'V', angle: 0, position: 'insideTop', fill: 'hsl(180 100% 35%)', fontSize: 10, fontWeight: 600 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(35 85% 48%)', fontSize: 9 }} tickLine={false} axisLine={false}
          label={{ value: 'A', angle: 0, position: 'insideTop', fill: 'hsl(35 85% 48%)', fontSize: 10, fontWeight: 600 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card, hsl(220 15% 11%))',
            border: '1px solid var(--color-border, hsl(220 15% 18%))',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--color-foreground, hsl(210 20% 96%))',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="hsl(180 100% 40%)" strokeWidth={1.5} dot={false} name="电压" isAnimationActive={false} />
        <Line yAxisId="right" type="monotone" dataKey="current" stroke="hsl(35 85% 50%)" strokeWidth={1.5} dot={false} name="电流" isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** 告警列表 */
function AlarmList({ alarms }: { alarms: AlarmInfo[] }) {
  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-1">
        <span className="text-lg">✓</span>
        <span className="text-xs">系统正常</span>
      </div>
    );
  }

  const levelStyle: Record<string, string> = {
    critical: 'text-bms-danger bg-bms-danger/10 border-bms-danger/30',
    warning: 'text-bms-warn bg-bms-warn/10 border-bms-warn/30',
    info: 'text-bms-info bg-bms-info/10 border-bms-info/30',
  };

  const levelLabel: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '信息',
  };

  return (
    <div className="space-y-1.5 max-h-32 overflow-y-auto">
      {[...alarms].reverse().slice(0, 10).map((alarm) => (
        <div key={alarm.id} className={cn('flex items-center gap-2 p-2 rounded border text-xs', levelStyle[alarm.level])}>
          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-background/50">
            {levelLabel[alarm.level]}
          </span>
          <span className="flex-1 truncate">{alarm.message}</span>
          <span className="text-[10px] opacity-60 font-mono-num shrink-0">
            {new Date(alarm.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

export function BatteryInfoPanel() {
  const [batteryData, setBatteryData] = useState<BatteryData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [alarms, setAlarms] = useState<AlarmInfo[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 启动 1 秒刷新
    bmsManager.startRefresh();

    bmsManager.onData(setBatteryData);
    bmsManager.onChart(setChartData);
    bmsManager.onAlarms(setAlarms);

    return () => {
      bmsManager.stopRefresh();
      bmsManager.offData(setBatteryData);
      bmsManager.offChart(setChartData);
      bmsManager.offAlarms(setAlarms);
    };
  }, []);

  const currentDir = batteryData
    ? batteryData.current > 0 ? '充电' : batteryData.current < 0 ? '放电' : '静置'
    : '';

  if (!batteryData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        等待电池数据...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-3 space-y-3">
      {/* 第一行：SOC+电压电流 合并容器 + 辅助指标 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* SOC + 电压 + 电流 合并容器（左侧SOC，右侧上下两行） */}
        <div className="md:col-span-2">
          <SOCVoltageCurrentCard data={batteryData} direction={currentDir} />
        </div>

        {/* 辅助指标 6 个 */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <MetricCard label="功率" value={Math.abs(batteryData.power).toFixed(0)} unit="W" />
          <MetricCard label="剩余容量" value={batteryData.remainingCapacity.toFixed(1)} unit="Ah" color="ok" />
          <MetricCard label="SOH" value={batteryData.soh} unit="%" color={batteryData.soh > 80 ? 'ok' : batteryData.soh > 60 ? 'warn' : 'danger'} />
          <MetricCard label="循环次数" value={batteryData.cycleCount} />
          <MetricCard label="最高温度" value={batteryData.maxCellTemp.toFixed(1)} unit="°C"
            color={batteryData.maxCellTemp > 45 ? 'danger' : batteryData.maxCellTemp > 35 ? 'warn' : 'ok'} />
          <MetricCard label="最低温度" value={batteryData.minCellTemp.toFixed(1)} unit="°C" />
        </div>
      </div>

      {/* 第二行：电压电流曲线 */}
      <div className="bg-card border border-border rounded-xl p-3 pb-1">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">电压 / 电流曲线</div>
        <div className="h-44 -mx-1">
          <VoltageCurrentChart data={chartData} />
        </div>
      </div>

      {/* 第三行：单体电压 + 温度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">单体电压</div>
          <CellVoltageChart cells={batteryData.cells} />
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">电芯温度</div>
          <TemperatureGrid cells={batteryData.cells} />
        </div>
      </div>

      {/* 第四行：设备信息 + 状态指示 + 告警 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 设备信息 */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">设备信息</div>
          <div className="space-y-1 text-xs font-mono-num">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">电芯数</span>
              <span>{batteryData.cells.length}S</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">压差</span>
              <span className={(batteryData.maxCellVoltage - batteryData.minCellVoltage) > 100 ? 'text-bms-danger' : 'text-bms-ok'}>
                {(batteryData.maxCellVoltage - batteryData.minCellVoltage).toFixed(0)}mV
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">平均电压</span>
              <span>{(batteryData.avgCellVoltage / 1000).toFixed(3)}V</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">额定容量</span>
              <span>{batteryData.capacity}Ah</span>
            </div>
          </div>
        </div>

        {/* 状态指示 */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">状态指示</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full',
                batteryData.soc > 20 ? 'bg-bms-ok' : 'bg-bms-danger')} />
              <span>SOC {batteryData.soc > 20 ? '正常' : '过低'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full',
                batteryData.maxCellTemp < 45 ? 'bg-bms-ok' : 'bg-bms-danger')} />
              <span>温度 {batteryData.maxCellTemp < 45 ? '正常' : '过高'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full',
                (batteryData.maxCellVoltage - batteryData.minCellVoltage) < 100 ? 'bg-bms-ok' : 'bg-bms-warn')} />
              <span>压差 {(batteryData.maxCellVoltage - batteryData.minCellVoltage) < 100 ? '正常' : '偏大'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full',
                batteryData.current !== 0 ? 'bg-bms-info animate-pulse' : 'bg-muted-foreground')} />
              <span>{batteryData.current > 0 ? '充电中' : batteryData.current < 0 ? '放电中' : '静置'}</span>
            </div>
          </div>
        </div>

        {/* 告警 */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">告警</div>
            {alarms.length > 0 && (
              <button onClick={() => bmsManager.clearAlarms()} className="text-[10px] text-muted-foreground hover:text-foreground">
                清除
              </button>
            )}
          </div>
          <AlarmList alarms={alarms} />
        </div>
      </div>
    </div>
  );
}
