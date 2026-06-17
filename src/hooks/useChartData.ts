import { useState, useEffect } from 'react';
import { bmsManager } from '@/lib/bms-manager';
import type { ChartPoint } from '@/lib/bms-manager';

export function useChartData(): ChartPoint[] {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const handleChart = (points: ChartPoint[]) => {
      setChartData([...points]);
    };

    bmsManager.onChart(handleChart);

    return () => {
      bmsManager.offChart(handleChart);
    };
  }, []);

  return chartData;
}
