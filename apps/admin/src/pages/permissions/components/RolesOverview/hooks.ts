import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRoleName,
  putRolePermissions,
  type ICreateRolePayload,
  type IRole,
} from '@/services/roles';
import type { IRolesOverviewState } from './type';

export const useRolesOverview = () => {
  const [state, setState] = useState<IRolesOverviewState>({
    loading: false,
    saving: false,
    roles: [],
    permissions: [],
  });

  const load = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const [rolesRes, permsRes] = await Promise.all([
        listRoles(),
        listPermissions(),
      ]);
      setState((prev) => ({
        ...prev,
        loading: false,
        roles: rolesRes.items,
        permissions: permsRes.items,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false }));
      message.error(err instanceof Error ? err.message : 'Load failed');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createCustomRole = useCallback(
    async (payload: ICreateRolePayload): Promise<IRole | null> => {
      setState((prev) => ({ ...prev, saving: true }));
      try {
        const role = await createRole(payload);
        message.success(`Role ${role.code} created`);
        await load();
        setState((prev) => ({ ...prev, saving: false }));
        return role;
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        message.error(err instanceof Error ? err.message : 'Create failed');
        return null;
      }
    },
    [load],
  );

  const removeRole = useCallback(
    async (role: IRole): Promise<void> => {
      try {
        await deleteRole(role.id);
        message.success(`Role ${role.code} deleted`);
        await load();
      } catch (err) {
        message.error(err instanceof Error ? err.message : 'Delete failed');
      }
    },
    [load],
  );

  const saveRoleEdits = useCallback(
    async (
      role: IRole,
      nextName: string,
      nextPermissionCodes: string[],
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, saving: true }));
      try {
        if (nextName.trim() && nextName.trim() !== role.name) {
          await updateRoleName(role.id, nextName.trim());
        }
        await putRolePermissions(role.id, nextPermissionCodes);
        message.success(`Role ${role.code} updated`);
        await load();
        setState((prev) => ({ ...prev, saving: false }));
        return true;
      } catch (err) {
        setState((prev) => ({ ...prev, saving: false }));
        message.error(err instanceof Error ? err.message : 'Save failed');
        return false;
      }
    },
    [load],
  );

  return { state, load, createCustomRole, removeRole, saveRoleEdits };
};
