import type { AdminUser } from '@/services/users';
import type { IPermission, IUserGrant, TGrantEffect } from '@/services/roles';

export interface IUserGrantsDrawerProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onChanged?: () => void;
}

export interface IGrantFormState {
  permissionId: number | null;
  effect: TGrantEffect;
  reason: string;
  expiresAt: string | null;
  restaurantIdsInput: string;
  scopeEnabled: boolean;
}

export interface IUserGrantsDrawerState {
  loading: boolean;
  saving: boolean;
  grants: IUserGrant[];
  permissions: IPermission[];
  editing: IUserGrant | null;
  form: IGrantFormState;
}
