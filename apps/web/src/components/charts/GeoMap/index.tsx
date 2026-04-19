import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useServiceData } from '@/components/Service/context';

interface IGeoItem {
  name: string;
  coords: [number, number];
  orders: number;
}

export const GeoMap: React.FC = () => {
  const { data, loading } = useServiceData();
  const items = (data as IGeoItem[]) || [];

  const option = useMemo(
    () => ({
      backgroundColor: '#fafaf9',
      tooltip: {
        trigger: 'item',
        formatter: (params: { name: string; value: [number, number, number] }) =>
          `${params.name}<br/>Orders today: <b>${params.value[2]}</b>`,
      },
      xAxis: {
        type: 'value',
        min: 99.5,
        max: 119.5,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: 1.0,
        max: 6.8,
        show: false,
      },
      series: [
        {
          type: 'scatter',
          data: items.map((d) => ({
            name: d.name,
            value: [d.coords[0], d.coords[1], d.orders],
          })),
          symbolSize: (val: [number, number, number]) => Math.max(12, Math.sqrt(val[2]) * 2.2),
          itemStyle: { color: '#f59e0b', opacity: 0.85, borderColor: '#fff', borderWidth: 1.5 },
          label: {
            show: true,
            formatter: (params: { name: string }) => params.name,
            position: 'top',
            fontSize: 10,
            color: '#6b7280',
          },
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          bottom: 4,
          style: {
            text: 'Bubble size = daily orders · Coordinates: Peninsular Malaysia + Borneo',
            fontSize: 10,
            fill: '#9ca3af',
          },
        },
      ],
    }),
    [items],
  );

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading map...</div>;

  return <ReactECharts option={option} style={{ height: 280 }} />;
};
