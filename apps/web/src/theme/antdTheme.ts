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
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
} as const;

export const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Single source of truth for the FOTR antd theme.
 * Applied globally via `src/app.tsx`.
 *
 * Do NOT wrap individual pages/components in a second <ConfigProvider>.
 * If you need a local tweak, pass props to the component instead.
 */
export const fotrAntdTheme: ThemeConfig = {
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
    borderRadius: 12,
    borderRadiusLG: 14,
    borderRadiusSM: 8,
    controlHeightLG: 52,
    controlHeight: 40,
    fontSize: 15,
    fontFamily: FONT_STACK,
  },
  components: {
    Button: {
      controlHeightLG: 52,
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
      borderRadiusLG: 9999,
      borderRadius: 9999,
    },
    Input: {
      controlHeightLG: 52,
      paddingBlockLG: 14,
      paddingInlineLG: 16,
    },
    Select: {
      controlHeightLG: 52,
    },
    DatePicker: {
      controlHeightLG: 52,
    },
    Form: {
      labelColor: BRAND_COLORS.textPrimary,
      labelFontSize: 14,
      verticalLabelPadding: '0 0 6px',
    },
    Card: {
      borderRadiusLG: 16,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Drawer: {
      borderRadiusLG: 16,
    },
    Table: {
      borderRadius: 12,
      headerBg: BRAND_COLORS.surfaceAlt,
    },
  },
};
