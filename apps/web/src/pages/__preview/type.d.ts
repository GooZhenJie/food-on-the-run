import type { ISchemaNode } from '@/components/Render/type';
import type {
  TPreviewAuth,
  TPreviewDevice,
  TPreviewLocale,
} from '@/components/Render/preview/context';
import type {
  TFixturePreset,
  TFixtureState,
} from '@/components/Render/preview/fixtures';

export interface IPreviewQueryParams {
  schema: ISchemaNode | null;
  preset: TFixturePreset;
  state: TFixtureState;
  auth: TPreviewAuth;
  locale: TPreviewLocale;
  device: TPreviewDevice;
}

export type TPreviewMessageType = 'preview:update' | 'preview:ready';

export interface IPreviewUpdateMessage {
  type: 'preview:update';
  payload: Partial<Omit<IPreviewQueryParams, 'schema'>> & {
    schema?: ISchemaNode;
  };
}

export interface IPreviewReadyMessage {
  type: 'preview:ready';
}

export type TPreviewMessage = IPreviewUpdateMessage | IPreviewReadyMessage;
