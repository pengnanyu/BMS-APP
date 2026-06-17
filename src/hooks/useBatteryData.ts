import { useState, useEffect } from 'react';
import { bmsManager } from '@/lib/bms-manager';
import type { BatteryData, ChartPoint } from '@/lib/bms-manager';

interface BatteryDataState {
  batteryData: BatteryData | null;
  chartData: ChartPoint[];
  isLoading: boolean;
}

export function useBatteryData(): BatteryDataState {
  const [batteryData, setBatteryData] = useState<BatteryData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleData = (data: BatteryData) => {
      setBatteryData(data);
      setIsLoading(false);
    };

    const handleChart = (points: ChartPoint[]) => {
      setChartData([...points]);
    };

    bmsManager.onData(handleData);
    bmsManager.onChart(handleChart);
    bmsManager.startRefresh();

    return () => {
      bmsManager.offData(handleData);
      bmsManager.offChart(handleChart);
      bmsManager.stopRefresh();
    };
  }, []);

  return { batteryData, chartData, isLoading };
}
