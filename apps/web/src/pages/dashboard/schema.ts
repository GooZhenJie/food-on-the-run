import type { ISchemaNode } from '@/components/Render/type';

/**
 * Dev-time fallback schema for the merchant dashboard.
 *
 * Audience: a single-restaurant operator (the merchant). Metric taxonomy is
 * inspired by Uber Eats Manager, DoorDash Merchant Portal, and GrabFood
 * Merchant Center:
 *   1. Sales       — core top-line (orders, revenue, AOV, rating)
 *   2. Operations  — reliability score (acceptance, prep time, cancel, uptime)
 *   3. Trends      — 7-day sales curve
 *   4. Product     — category strength + popular dishes
 *   5. Geography   — delivery heatmap
 *
 * In production the same structure is served by the admin-published backend
 * (`GET /public/schemas?key=/dashboard`); this local copy is the offline/dev
 * fallback.
 */
export const DASHBOARD_PAGE_SCHEMA: ISchemaNode = {
  name: 'DashboardPage',
  props: {
    title: "Aunty Lily's Nasi Lemak",
    subtitle: 'Live operational overview — last updated just now',
    audience: 'Merchant',
    backHref: '/',
    backLabel: 'Home',
    withRefresh: true,
  },
  children: [
    {
      name: 'DashboardSection',
      props: { title: 'Sales', cols: 1, gap: 4, mb: 6 },
      children: [
        {
          name: 'KpiGrid',
          props: { api: '/api/dashboard/kpi', interval: 30000, cols: 4 },
          children: [],
        },
      ],
    },
    {
      name: 'DashboardSection',
      props: { title: 'Operations', cols: 1, gap: 4, mb: 6 },
      children: [
        {
          name: 'KpiGrid',
          props: { api: '/api/dashboard/ops-kpi', interval: 30000, cols: 4 },
          children: [],
        },
      ],
    },
    {
      name: 'DashboardSection',
      props: { cols: 2, gap: 6, mb: 6 },
      children: [
        {
          name: 'DashboardCard',
          props: { title: '7-Day Sales Trend', badge: 'Live · 30s' },
          children: [
            {
              name: 'SalesTrend',
              props: { api: '/api/dashboard/sales-trend', interval: 30000 },
              children: [],
            },
          ],
        },
        {
          name: 'DashboardCard',
          props: { title: 'Category Performance', badge: 'Sales Score' },
          children: [
            {
              name: 'RadarChart',
              props: { api: '/api/dashboard/category-radar' },
              children: [],
            },
          ],
        },
      ],
    },
    {
      name: 'DashboardSection',
      props: { cols: 2, gap: 6, mb: 6 },
      children: [
        {
          name: 'DashboardCard',
          props: { title: 'Popular Dishes', badge: 'Word Cloud' },
          children: [
            {
              name: 'WordCloud',
              props: { api: '/api/dashboard/wordcloud' },
              children: [],
            },
          ],
        },
        {
          name: 'DashboardCard',
          props: { title: 'Delivery Heatmap', badge: 'Malaysia' },
          children: [
            {
              name: 'GeoMap',
              props: { api: '/api/dashboard/geo' },
              children: [],
            },
          ],
        },
      ],
    },
  ],
};
