// ==================== 历史数据图表 ====================

import { useBMS } from '@/lib/bms-store';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function HistoryChart() {
  const { historyData } = useBMS();

  if (historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        等待历史数据...
      </div>
    );
  }

  const chartData = historyData.map((record) => ({
    time: format(record.timestamp, 'HH:mm:ss', { locale: zhCN }),
    voltage: record.voltage,
    current: record.current,
    soc: record.soc,
    power: record.power,
    maxTemp: record.maxCellTemp,
    minTemp: record.minCellTemp,
  }));

  return (
    <div className="space-y-4">
      {/* 电压/电流图表 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'hsl(215 15% 55%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(220 15% 18%)' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'hsl(180 100% 45%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(180 100% 45%)' }}
              label={{ value: '电压 (V)', angle: -90, position: 'insideLeft', fill: 'hsl(180 100% 45%)', fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'hsl(35 90% 55%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(35 90% 55%)' }}
              label={{ value: '电流 (A)', angle: 90, position: 'insideRight', fill: 'hsl(35 90% 55%)', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220 15% 11%)',
                border: '1px solid hsl(220 15% 18%)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'hsl(210 20% 96%)',
              }}
              labelStyle={{ color: 'hsl(215 15% 55%)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'hsl(215 15% 55%)' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="voltage"
              stroke="hsl(180 100% 45%)"
              strokeWidth={1.5}
              dot={false}
              name="电压"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="current"
              stroke="hsl(35 90% 55%)"
              strokeWidth={1.5}
              dot={false}
              name="电流"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SOC/温度图表 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'hsl(215 15% 55%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(220 15% 18%)' }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fill: 'hsl(140 70% 45%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(140 70% 45%)' }}
              label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft', fill: 'hsl(140 70% 45%)', fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'hsl(0 85% 55%)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(0 85% 55%)' }}
              label={{ value: '温度 (°C)', angle: 90, position: 'insideRight', fill: 'hsl(0 85% 55%)', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220 15% 11%)',
                border: '1px solid hsl(220 15% 18%)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'hsl(210 20% 96%)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: 'hsl(215 15% 55%)' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="soc"
              stroke="hsl(140 70% 45%)"
              strokeWidth={1.5}
              dot={false}
              name="SOC"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="maxTemp"
              stroke="hsl(0 85% 55%)"
              strokeWidth={1.5}
              dot={false}
              name="最高温度"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="minTemp"
              stroke="hsl(270 70% 60%)"
              strokeWidth={1.5}
              dot={false}
              name="最低温度"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
