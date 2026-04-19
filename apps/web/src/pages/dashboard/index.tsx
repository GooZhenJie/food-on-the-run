import React from 'react';
import { Link } from 'umi';
import { Refresh } from '@/components/Refresh';
import { Service } from '@/components/Service';
import { SalesTrend } from '@/components/charts/SalesTrend';
import { RadarChart } from '@/components/charts/RadarChart';
import { WordCloud } from '@/components/charts/WordCloud';
import { GeoMap } from '@/components/charts/GeoMap';
import { useServiceData } from '@/components/Service/context';

interface IKpiCard {
  label: string;
  value: number;
  unit: string;
  trend: string;
}

const KpiCards: React.FC = () => {
  const { data, loading } = useServiceData();
  const cards = (data as IKpiCard[]) || [];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {card.unit === 'RM' ? `RM ${card.value.toLocaleString()}` : `${card.value} ${card.unit}`}
          </p>
          <p className="text-xs text-green-600 mt-1 font-semibold">{card.trend} vs yesterday</p>
        </div>
      ))}
    </div>
  );
};

interface IChartCardProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<IChartCardProps> = ({ title, badge, children }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <h3 className="font-bold text-gray-800">{title}</h3>
      {badge && (
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 transition-colors mb-2"
            >
              ← Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">📊 Restaurant Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Aunty Lily's Nasi Lemak — Live Overview</p>
          </div>
        </div>

        {/*
          Refresh wraps everything. All Service components inside register themselves.
          Clicking "Refresh All" triggers every Service to re-fetch simultaneously.
          The coordinator collects all completion signals before showing a unified status.
        */}
        <Refresh>
          {/* KPI Row */}
          <div className="mb-6">
            <Service api="/api/dashboard/kpi" interval={30000}>
              <KpiCards />
            </Service>
          </div>

          {/* Charts grid — 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard title="7-Day Sales Trend" badge="Live · 30s">
              <Service api="/api/dashboard/sales-trend" interval={30000}>
                <SalesTrend />
              </Service>
            </ChartCard>

            <ChartCard title="Category Radar" badge="Sales Score">
              <Service api="/api/dashboard/category-radar">
                <RadarChart />
              </Service>
            </ChartCard>
          </div>

          {/* Full-width charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Popular Dishes" badge="Word Cloud">
              <Service api="/api/dashboard/wordcloud">
                <WordCloud />
              </Service>
            </ChartCard>

            <ChartCard title="Restaurant Locations" badge="Malaysia">
              <Service api="/api/dashboard/geo">
                <GeoMap />
              </Service>
            </ChartCard>
          </div>
        </Refresh>

        {/* Tech callout */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <p className="font-semibold mb-2">🔌 Architecture Notes</p>
          <ul className="list-disc list-inside flex flex-col gap-1 text-amber-700">
            <li>Each chart is wrapped in an independent <code className="bg-amber-100 px-1 rounded">Service</code> component — handles its own fetch, loading state, and polling.</li>
            <li><code className="bg-amber-100 px-1 rounded">Refresh</code> coordinates all Services on this page. Click "Refresh All" above to see the batch-completion flow.</li>
            <li>Sales Trend and KPI poll every 30 seconds automatically.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
