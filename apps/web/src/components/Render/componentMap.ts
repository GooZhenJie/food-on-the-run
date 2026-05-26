import {
  HeroBanner,
  MenuGrid,
  ReviewList,
  InfoCard,
  PageWrapper,
  AuthPage,
  AuthForm,
  AuthDivider,
  OAuthSection,
  DashboardPage,
  DashboardSection,
  DashboardCard,
  KpiGrid,
} from './schemaComponents';
import { SalesTrend } from '@/components/charts/SalesTrend';
import { RadarChart } from '@/components/charts/RadarChart';
import { WordCloud } from '@/components/charts/WordCloud';
import { GeoMap } from '@/components/charts/GeoMap';
import type { IComponentMap } from './type';

/**
 * Charts consume data exclusively through `useServiceData()` and accept no
 * schema props, so we widen them to the shared schema-component shape.
 */
type TSchemaComponent = React.ComponentType<Record<string, unknown>>;

export const componentMap: IComponentMap = {
  RestaurantPage: PageWrapper,
  HeroBanner,
  MenuGrid,
  ReviewList,
  InfoCard,
  AuthPage,
  AuthForm,
  AuthDivider,
  OAuthSection,
  DashboardPage,
  DashboardSection,
  DashboardCard,
  KpiGrid,
  SalesTrend: SalesTrend as unknown as TSchemaComponent,
  RadarChart: RadarChart as unknown as TSchemaComponent,
  WordCloud: WordCloud as unknown as TSchemaComponent,
  GeoMap: GeoMap as unknown as TSchemaComponent,
};
