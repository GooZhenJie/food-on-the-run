import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useServiceData } from '@/components/Service/context';

interface IRadarItem {
  name: string;
  value: number;
}

export const RadarChart: React.FC = () => {
  const { data, loading } = useServiceData();
  const items = (data as IRadarItem[]) || [];

  const option = useMemo(
    () => ({
      tooltip: {},
      radar: {
        indicator: items.map((d) => ({ name: d.name, max: 100 })),
        axisName: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        splitArea: { areaStyle: { color: ['rgba(245,158,11,0.03)', 'rgba(245,158,11,0.06)'] } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: items.map((d) => d.value),
              name: 'Sales Score',
              areaStyle: { color: 'rgba(245,158,11,0.2)' },
              lineStyle: { color: '#f59e0b', width: 2 },
              itemStyle: { color: '#f59e0b' },
            },
          ],
        },
      ],
    }),
    [items],
  );

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>;

  return <ReactECharts option={option} style={{ height: 260 }} />;
};
