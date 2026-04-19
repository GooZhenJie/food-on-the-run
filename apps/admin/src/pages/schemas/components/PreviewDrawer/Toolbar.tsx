import React from 'react';
import { Select, Space } from 'antd';
import type {
  IPreviewSettings,
  TPreviewAuth,
  TPreviewDataState,
  TPreviewDevice,
  TPreviewLocale,
  TPreviewPreset,
} from './type';

interface IPreviewToolbarProps {
  settings: IPreviewSettings;
  onChange: (next: Partial<IPreviewSettings>) => void;
}

const PRESET_OPTIONS: { label: string; value: TPreviewPreset }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Empty', value: 'empty' },
  { label: 'Heavy', value: 'heavy' },
  { label: 'Edge cases', value: 'edge' },
];

const STATE_OPTIONS: { label: string; value: TPreviewDataState }[] = [
  { label: 'Success', value: 'success' },
  { label: 'Loading', value: 'loading' },
  { label: 'Error', value: 'error' },
];

const AUTH_OPTIONS: { label: string; value: TPreviewAuth }[] = [
  { label: 'Guest', value: 'guest' },
  { label: 'Logged in', value: 'logged-in' },
];

const LOCALE_OPTIONS: { label: string; value: TPreviewLocale }[] = [
  { label: 'English', value: 'en' },
  { label: '中文', value: 'zh' },
  { label: 'Bahasa', value: 'ms' },
];

const DEVICE_OPTIONS: { label: string; value: TPreviewDevice }[] = [
  { label: 'Mobile 390px', value: 'mobile' },
  { label: 'Tablet 820px', value: 'tablet' },
  { label: 'Desktop 1200px', value: 'desktop' },
];

export const PreviewToolbar: React.FC<IPreviewToolbarProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
      <Space size={8} wrap>
        <span className="text-xs text-gray-500 self-center">Data</span>
        <Select<TPreviewPreset>
          size="small"
          style={{ width: 120 }}
          value={settings.preset}
          onChange={(v) => onChange({ preset: v })}
          options={PRESET_OPTIONS}
        />
        <Select<TPreviewDataState>
          size="small"
          style={{ width: 110 }}
          value={settings.dataState}
          onChange={(v) => onChange({ dataState: v })}
          options={STATE_OPTIONS}
        />
      </Space>
      <Space size={8} wrap>
        <span className="text-xs text-gray-500 self-center">Auth</span>
        <Select<TPreviewAuth>
          size="small"
          style={{ width: 110 }}
          value={settings.auth}
          onChange={(v) => onChange({ auth: v })}
          options={AUTH_OPTIONS}
        />
        <span className="text-xs text-gray-500 self-center">Locale</span>
        <Select<TPreviewLocale>
          size="small"
          style={{ width: 100 }}
          value={settings.locale}
          onChange={(v) => onChange({ locale: v })}
          options={LOCALE_OPTIONS}
        />
      </Space>
      <Space size={8} wrap>
        <span className="text-xs text-gray-500 self-center">Device</span>
        <Select<TPreviewDevice>
          size="small"
          style={{ width: 160 }}
          value={settings.device}
          onChange={(v) => onChange({ device: v })}
          options={DEVICE_OPTIONS}
        />
      </Space>
    </div>
  );
};
