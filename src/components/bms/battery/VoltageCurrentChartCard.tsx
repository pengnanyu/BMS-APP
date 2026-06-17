import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { ChartPoint } from '@/types/bms';
import { EmptyState } from '@/components/bms/shared/EmptyState';

interface VoltageCurrentChartCardProps {
  data: ChartPoint[];
}

export function VoltageCurrentChartCard({ data }: VoltageCurrentChartCardProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">电压/电流曲线</h3>
        <EmptyState text="等待曲线数据..." />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">电压/电流曲线</h3>
      <div className="h-[200px] sm:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="voltage"
              tick={{ fontSize: 10, fill: 'var(--color-bms-info)' }}
              label={{ value: 'V', position: 'insideTopLeft', fontSize: 10, fill: 'var(--color-bms-info)' }}
            />
            <YAxis
              yAxisId="current"
              orientation="right"
              tick={{ fontSize: 10, fill: 'var(--color-bms-warn)' }}
              label={{ value: 'A', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-bms-warn)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="voltage"
              type="monotone"
              dataKey="voltage"
              stroke="var(--color-bms-info)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              name="电压"
            />
            <Line
              yAxisId="current"
              type="monotone"
              dataKey="current"
              stroke="var(--color-bms-warn)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              name="电流"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
