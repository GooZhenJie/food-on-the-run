export interface IPublishDrawerProps {
  open: boolean;
  initialKey?: string;
  onClose: () => void;
  onPublished: () => void;
}

export interface IPublishFormValues {
  key: string;
  schemaText: string;
  note?: string;
}

export type TPublishStep = 'edit' | 'review';

export type TDiffLineType = 'same' | 'add' | 'del';

export interface IDiffLine {
  type: TDiffLineType;
  text: string;
}

export interface IDiffSummary {
  added: number;
  removed: number;
  same: number;
}

export interface IPendingPublish {
  key: string;
  schemaData: unknown;
  note?: string;
}
