import {
  RESTAURANTS,
  MENU_ITEMS,
  REVIEWS,
  BANNERS,
  CUISINES,
} from './restaurants';
import { mockOAuth, mockForgotPassword } from './auth';
import { RESTAURANT_PAGE_SCHEMA } from '@/pages/restaurant/schema';
import { LOGIN_PAGE_SCHEMA } from '@/pages/login/schema';
import { SIGN_UP_PAGE_SCHEMA } from '@/pages/sign-up/schema';
import {
  SALES_TREND,
  CATEGORY_RADAR,
  POPULAR_DISHES_WORDCLOUD,
  KPI_CARDS,
  GEO_RESTAURANTS,
} from '@/pages/dashboard/mock';

export default {
  'GET /api/restaurants': RESTAURANTS,
  'GET /api/banners': BANNERS,
  'GET /api/cuisines': CUISINES,
  'GET /api/restaurant/schema': RESTAURANT_PAGE_SCHEMA,
  'GET /api/menu': MENU_ITEMS,
  'GET /api/reviews': REVIEWS,
  'GET /api/dashboard/sales-trend': SALES_TREND,
  'GET /api/dashboard/category-radar': CATEGORY_RADAR,
  'GET /api/dashboard/wordcloud': POPULAR_DISHES_WORDCLOUD,
  'GET /api/dashboard/kpi': KPI_CARDS,
  'GET /api/dashboard/geo': GEO_RESTAURANTS,

  // /api/auth/register, /login, /refresh, /logout are served by the Go backend
  // via the Umi dev proxy (see `proxy` in .umirc.ts).
  // OAuth and forgot-password are still mocked here until the real endpoints land.
  'POST /api/auth/oauth/:provider': mockOAuth,
  'POST /api/auth/password/forgot': mockForgotPassword,

  // Config-driven auth pages — the schemas will later be served by an admin backend.
  'GET /api/auth/login/schema': LOGIN_PAGE_SCHEMA,
  'GET /api/auth/sign-up/schema': SIGN_UP_PAGE_SCHEMA,
};
