import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-wordcloud';
import { useServiceData } from '@/components/Service/context';

interface IWordItem {
  name: string;
  value: number;
}

export const WordCloud: React.FC = () => {
  const { data, loading } = useServiceData();
  const items = (data as IWordItem[]) || [];

  const option = useMemo(
    () => ({
      series: [
        {
          type: 'wordCloud',
          shape: 'circle',
          sizeRange: [14, 48],
          rotationRange: [-45, 45],
          gridSize: 8,
          width: '100%',
          height: '100%',
          textStyle: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            color: () => {
              const palette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316'];
              return palette[Math.floor(Math.random() * palette.length)];
            },
          },
          emphasis: { textStyle: { shadowBlur: 10, shadowColor: '#f59e0b' } },
          data: items,
        },
      ],
    }),
    [items],
  );

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>;

  return <ReactECharts option={option} style={{ height: 260 }} />;
};
