import type { IRole, IPermission } from '@/services/roles';

export interface IRolesOverviewState {
  loading: boolean;
  saving: boolean;
  roles: IRole[];
  permissions: IPermission[];
}
