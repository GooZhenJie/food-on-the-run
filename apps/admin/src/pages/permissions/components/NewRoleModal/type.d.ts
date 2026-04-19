import type { TAdminRole } from '@/services/type';
import type { ICreateRolePayload } from '@/services/roles';

export interface INewRoleModalProps {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: ICreateRolePayload) => Promise<void>;
}

export interface INewRoleFormState {
  persona: TAdminRole;
  suffix: string;
  name: string;
}
