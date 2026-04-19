export type TPreviewPreset = 'normal' | 'empty' | 'heavy' | 'edge';
export type TPreviewDataState = 'success' | 'loading' | 'error';
export type TPreviewAuth = 'guest' | 'logged-in';
export type TPreviewLocale = 'en' | 'zh' | 'ms';
export type TPreviewDevice = 'mobile' | 'tablet' | 'desktop';

export interface IPreviewSettings {
  preset: TPreviewPreset;
  dataState: TPreviewDataState;
  auth: TPreviewAuth;
  locale: TPreviewLocale;
  device: TPreviewDevice;
}

export interface IPreviewDrawerProps {
  open: boolean;
  /** Optional title shown in the drawer header, e.g. the route key */
  title?: string;
  /** The schema JSON to render inside the iframe */
  schema: unknown;
  onClose: () => void;
}

export type TPreviewMessageType = 'preview:update' | 'preview:ready';

export interface IPreviewUpdatePayload {
  schema?: unknown;
  preset?: TPreviewPreset;
  state?: TPreviewDataState;
  auth?: TPreviewAuth;
  locale?: TPreviewLocale;
  device?: TPreviewDevice;
}

export interface IPreviewUpdateMessage {
  type: 'preview:update';
  payload: IPreviewUpdatePayload;
}

export interface IPreviewReadyMessage {
  type: 'preview:ready';
}

export type TPreviewMessage = IPreviewUpdateMessage | IPreviewReadyMessage;
