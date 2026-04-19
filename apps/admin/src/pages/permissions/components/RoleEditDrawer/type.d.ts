import type { IPermission, IRole } from '@/services/roles';

export interface IRoleEditDrawerProps {
  open: boolean;
  role: IRole | null;
  allPermissions: IPermission[];
  saving: boolean;
  onClose: () => void;
  onSave: (nextName: string, nextPermissionCodes: string[]) => Promise<boolean>;
}
