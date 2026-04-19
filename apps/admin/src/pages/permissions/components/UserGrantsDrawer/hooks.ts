import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type { AdminUser } from '@/services/users';
import {
  deleteUserGrant,
  listPermissions,
  listUserGrants,
  putUserGrant,
  type IPermission,
  type IUserGrant,
} from '@/services/roles';
import type { IGrantFormState, IUserGrantsDrawerState } from './type';

const INITIAL_FORM: IGrantFormState = {
  permissionId: null,
  effect: 'allow',
  reason: '',
  expiresAt: null,
  restaurantIdsInput: '',
  scopeEnabled: false,
};

const parseRestaurantIds = (raw: string): number[] => {
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Array.from(new Set(ids));
};

const grantToForm = (
  g: IUserGrant,
  permissions: IPermission[],
): IGrantFormState => {
  const match = permissions.find((p) => p.code === g.permission_code);
  const ids = g.scope?.restaurant_ids ?? [];
  return {
    permissionId: match?.id ?? g.permission_id,
    effect: g.effect,
    reason: g.reason ?? '',
    expiresAt: g.expires_at ?? null,
    restaurantIdsInput: ids.join(','),
    scopeEnabled: Boolean(g.scope && g.scope.restaurant_ids?.length),
  };
};

export const useUserGrantsDrawer = (
  user: AdminUser | null,
  open: boolean,
  onChanged?: () => void,
) => {
  const [state, setState] = useState<IUserGrantsDrawerState>({
    loading: false,
    saving: false,
    grants: [],
    permissions: [],
    editing: null,
    form: INITIAL_FORM,
  });

  const load = useCallback(async (target: AdminUser): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const [grantsRes, permsRes] = await Promise.all([
        listUserGrants(target.id),
        listPermissions(),
      ]);
      setState((prev) => ({
        ...prev,
        loading: false,
        grants: grantsRes.items,
        permissions: permsRes.items,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false }));
      message.error(err instanceof Error ? err.message : 'Load failed');
    }
  }, []);

  useEffect(() => {
    if (open && user) load(user);
  }, [open, user, load]);

  const startCreate = useCallback((): void => {
    setState((prev) => ({ ...prev, editing: null, form: INITIAL_FORM }));
  }, []);

  const startEdit = useCallback((grant: IUserGrant): void => {
    setState((prev) => ({
      ...prev,
      editing: grant,
      form: grantToForm(grant, prev.permissions),
    }));
  }, []);

  const cancelEdit = useCallback((): void => {
    setState((prev) => ({ ...prev, editing: null, form: INITIAL_FORM }));
  }, []);

  const updateForm = useCallback(
    (patch: Partial<IGrantFormState>): void => {
      setState((prev) => ({ ...prev, form: { ...prev.form, ...patch } }));
    },
    [],
  );

  const save = useCallback(async (): Promise<void> => {
    if (!user) return;
    const { form } = state;
    if (!form.permissionId) {
      message.error('Please pick a permission');
      return;
    }
    if (!form.reason.trim()) {
      message.error('Reason is required');
      return;
    }
    const restaurantIds = form.scopeEnabled
      ? parseRestaurantIds(form.restaurantIdsInput)
      : [];
    const scopePayload =
      form.scopeEnabled && restaurantIds.length > 0
        ? { restaurant_ids: restaurantIds }
        : null;

    setState((prev) => ({ ...prev, saving: true }));
    try {
      await putUserGrant(user.id, form.permissionId, {
        effect: form.effect,
        scope: scopePayload,
        reason: form.reason.trim(),
        expires_at: form.expiresAt,
      });
      message.success('Override saved');
      setState((prev) => ({
        ...prev,
        saving: false,
        editing: null,
        form: INITIAL_FORM,
      }));
      await load(user);
      onChanged?.();
    } catch (err) {
      setState((prev) => ({ ...prev, saving: false }));
      message.error(err instanceof Error ? err.message : 'Save failed');
    }
  }, [user, state, load, onChanged]);

  const remove = useCallback(
    async (grant: IUserGrant): Promise<void> => {
      if (!user) return;
      try {
        await deleteUserGrant(user.id, grant.permission_id);
        message.success('Override removed');
        await load(user);
        onChanged?.();
      } catch (err) {
        message.error(err instanceof Error ? err.message : 'Delete failed');
      }
    },
    [user, load, onChanged],
  );

  return {
    state,
    startCreate,
    startEdit,
    cancelEdit,
    updateForm,
    save,
    remove,
  };
};
