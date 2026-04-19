import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

export const BRAND_COLORS = {
  primary: '#F97316',
  primaryHover: '#EA580C',
  primaryActive: '#C2410C',
  primarySoft: '#FFF7ED',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  sidebarBg: '#0F172A',
  sidebarText: '#CBD5E1',
  sidebarTextActive: '#FFFFFF',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
} as const;

export const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Single source of truth for the admin antd theme.
 * Applied globally via `src/app.tsx`.
 *
 * Admin differs from the consumer theme in:
 *   - denser controls (standard 32 / 40px heights, not 40 / 52)
 *   - square-ish radius (6 / 8 / 10, not 12 / 14)
 *   - standard buttons, not pill-shaped
 *   - smaller base font (14, not 15)
 *
 * Do NOT wrap individual pages/components in a second <ConfigProvider>.
 */
export const adminAntdTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: BRAND_COLORS.primary,
    colorPrimaryHover: BRAND_COLORS.primaryHover,
    colorPrimaryActive: BRAND_COLORS.primaryActive,
    colorLink: BRAND_COLORS.primaryHover,
    colorLinkHover: BRAND_COLORS.primaryActive,
    colorSuccess: BRAND_COLORS.success,
    colorWarning: BRAND_COLORS.warning,
    colorError: BRAND_COLORS.danger,
    borderRadius: 8,
    borderRadiusLG: 10,
    borderRadiusSM: 6,
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    fontSize: 14,
    fontFamily: FONT_STACK,
  },
  components: {
    Button: {
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Table: {
      borderRadius: 8,
      headerBg: BRAND_COLORS.surfaceAlt,
      headerColor: BRAND_COLORS.textSecondary,
      headerSplitColor: 'transparent',
      rowHoverBg: BRAND_COLORS.surfaceAlt,
    },
    Card: {
      borderRadiusLG: 10,
    },
    Modal: {
      borderRadiusLG: 10,
    },
    Drawer: {
      borderRadiusLG: 0,
    },
    Menu: {
      itemBg: BRAND_COLORS.sidebarBg,
      itemColor: BRAND_COLORS.sidebarText,
      itemHoverBg: '#1E293B',
      itemHoverColor: BRAND_COLORS.sidebarTextActive,
      itemSelectedBg: BRAND_COLORS.primary,
      itemSelectedColor: BRAND_COLORS.sidebarTextActive,
      subMenuItemBg: BRAND_COLORS.sidebarBg,
      iconSize: 16,
    },
    Form: {
      labelColor: BRAND_COLORS.textPrimary,
      labelFontSize: 13,
      verticalLabelPadding: '0 0 4px',
    },
  },
};
