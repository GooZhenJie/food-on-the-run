import type { TAdminRole } from '@/services/type';
import type { AdminUser, IUserScope } from '@/services/users';
import type { IRole, IRoleAssignment } from '@/services/roles';

export interface IRolesDrawerProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}

export interface IRolesDrawerState {
  loading: boolean;
  saving: boolean;
  availableRoles: IRole[];
  selectedCodes: string[];
  assignments: IRoleAssignment[];
  persona: TAdminRole | null;
  scope: IUserScope | null;
  scopeEditing: { roleId: number } | null;
  scopeForm: IScopeFormState;
}

export interface IScopeFormState {
  restaurantIdsInput: string;
  expiresAt: string | null;
  enabled: boolean;
}
