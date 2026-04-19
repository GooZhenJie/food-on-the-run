import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useServiceData } from '@/components/Service/context';

interface ISalesTrendItem {
  date: string;
  orders: number;
  revenue: number;
}

export const SalesTrend: React.FC = () => {
  const { data, loading } = useServiceData();
  const items = (data as ISalesTrendItem[]) || [];

  const option = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Orders', 'Revenue (RM)'], bottom: 0 },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: items.map((d) => d.date),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Orders',
          nameTextStyle: { color: '#6b7280', fontSize: 11 },
          axisLabel: { color: '#6b7280', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        {
          type: 'value',
          name: 'RM',
          nameTextStyle: { color: '#6b7280', fontSize: 11 },
          axisLabel: { color: '#6b7280', fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Orders',
          type: 'bar',
          data: items.map((d) => d.orders),
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Revenue (RM)',
          type: 'line',
          yAxisIndex: 1,
          data: items.map((d) => d.revenue),
          smooth: true,
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          areaStyle: { color: 'rgba(16,185,129,0.08)' },
        },
      ],
    }),
    [items],
  );

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>;

  return <ReactECharts option={option} style={{ height: 260 }} />;
};
