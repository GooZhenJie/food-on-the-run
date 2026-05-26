import type { IComponentFixtures } from '../../preview/fixtures';
import type { TKpiGridData } from './type';

const normal: TKpiGridData = [
  { label: "Today's Orders", value: 219, trend: '+18% vs yesterday', direction: 'up' },
  { label: "Today's Revenue", value: 2498, unit: 'RM', trend: '+23% vs yesterday', direction: 'up' },
  { label: 'Avg Order Value', value: 11.4, unit: 'RM', trend: '+RM 0.8', direction: 'up' },
  { label: 'Customer Rating', value: 4.7, unit: '/ 5', trend: '+0.1', direction: 'up' },
];

const heavy: TKpiGridData = [
  { label: "Today's Orders", value: 1820, trend: '+42% vs yesterday', direction: 'up' },
  { label: "Today's Revenue", value: 25480, unit: 'RM', trend: '+38% vs yesterday', direction: 'up' },
  { label: 'Avg Order Value', value: 14.0, unit: 'RM', trend: '+RM 1.6', direction: 'up' },
  { label: 'Customer Rating', value: 4.9, unit: '/ 5', trend: '+0.2', direction: 'up' },
];

const edge: TKpiGridData = [
  { label: 'Cancellation Rate', value: 22, unit: '%', trend: '+8%', direction: 'up', invertColor: true, note: 'needs attention' },
  { label: 'Avg Prep Time', value: 38, unit: 'min', trend: '+12min', direction: 'up', invertColor: true },
  { label: 'Store Online', value: 67, unit: '%', trend: '-20%', direction: 'down', invertColor: true },
  { label: 'Rating (last 50)', value: 3.2, unit: '/ 5', trend: '-0.6', direction: 'down' },
];

export const kpiGridFixtures: IComponentFixtures<TKpiGridData> = {
  presets: {
    normal,
    empty: [],
    heavy,
    edge,
  },
  errorMessage: 'HTTP 500: kpi service unavailable',
};
