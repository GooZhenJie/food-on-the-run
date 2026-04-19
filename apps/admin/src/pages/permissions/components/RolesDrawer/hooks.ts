import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type { AdminUser } from '@/services/users';
import { getUserScope } from '@/services/users';
import type { IRole, IRoleAssignment } from '@/services/roles';
import {
  listRoles,
  listUserRoles,
  putUserRoleScope,
  updateUserRoles,
} from '@/services/roles';
import type { IRolesDrawerState, IScopeFormState } from './type';

const INITIAL_SCOPE_FORM: IScopeFormState = {
  restaurantIdsInput: '',
  expiresAt: null,
  enabled: false,
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

export const useRolesDrawer = (
  user: AdminUser | null,
  open: boolean,
  onSaved: () => void,
) => {
  const [state, setState] = useState<IRolesDrawerState>({
    loading: false,
    saving: false,
    availableRoles: [],
    selectedCodes: [],
    assignments: [],
    persona: null,
    scope: null,
    scopeEditing: null,
    scopeForm: INITIAL_SCOPE_FORM,
  });

  const load = useCallback(async (target: AdminUser): Promise<void> => {
    setState((prev) => ({
      ...prev,
      loading: true,
      persona: target.role,
    }));
    try {
      const [allRoles, userRoles, scope] = await Promise.all([
        listRoles(),
        listUserRoles(target.id),
        getUserScope(target.id),
      ]);
      const scoped = allRoles.items.filter(
        (r: IRole) => r.persona === target.role,
      );
      setState({
        loading: false,
        saving: false,
        availableRoles: scoped,
        selectedCodes: userRoles.items.map((r) => r.code),
        assignments: userRoles.items,
        persona: target.role,
        scope,
        scopeEditing: null,
        scopeForm: INITIAL_SCOPE_FORM,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false }));
      message.error(err instanceof Error ? err.message : 'Load failed');
    }
  }, []);

  useEffect(() => {
    if (open && user) {
      load(user);
    }
  }, [open, user, load]);

  const toggleCode = useCallback((code: string, checked: boolean): void => {
    setState((prev) => {
      const set = new Set(prev.selectedCodes);
      if (checked) set.add(code);
      else set.delete(code);
      return { ...prev, selectedCodes: Array.from(set) };
    });
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (!user) return;
    setState((prev) => ({ ...prev, saving: true }));
    try {
      await updateUserRoles(user.id, state.selectedCodes);
      message.success(`Roles updated for ${user.email}`);
      setState((prev) => ({ ...prev, saving: false }));
      onSaved();
    } catch (err) {
      setState((prev) => ({ ...prev, saving: false }));
      message.error(err instanceof Error ? err.message : 'Save failed');
      throw err;
    }
  }, [user, state.selectedCodes, onSaved]);

  const reset = useCallback((): void => {
    setState({
      loading: false,
      saving: false,
      availableRoles: [],
      selectedCodes: [],
      assignments: [],
      persona: null,
      scope: null,
      scopeEditing: null,
      scopeForm: INITIAL_SCOPE_FORM,
    });
  }, []);

  const openScopeEditor = useCallback(
    (assignment: IRoleAssignment): void => {
      const ids = assignment.scope?.restaurant_ids ?? [];
      setState((prev) => ({
        ...prev,
        scopeEditing: { roleId: assignment.role_id },
        scopeForm: {
          restaurantIdsInput: ids.join(','),
          expiresAt: assignment.expires_at ?? null,
          enabled: Boolean(assignment.scope?.restaurant_ids?.length),
        },
      }));
    },
    [],
  );

  const closeScopeEditor = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      scopeEditing: null,
      scopeForm: INITIAL_SCOPE_FORM,
    }));
  }, []);

  const updateScopeForm = useCallback(
    (patch: Partial<IScopeFormState>): void => {
      setState((prev) => ({
        ...prev,
        scopeForm: { ...prev.scopeForm, ...patch },
      }));
    },
    [],
  );

  const saveScope = useCallback(async (): Promise<void> => {
    if (!user || !state.scopeEditing) return;
    const { scopeForm } = state;
    const restaurantIds = scopeForm.enabled
      ? parseRestaurantIds(scopeForm.restaurantIdsInput)
      : [];
    const scopePayload =
      scopeForm.enabled && restaurantIds.length > 0
        ? { restaurant_ids: restaurantIds }
        : null;

    setState((prev) => ({ ...prev, saving: true }));
    try {
      await putUserRoleScope(user.id, state.scopeEditing.roleId, {
        scope: scopePayload,
        expires_at: scopeForm.expiresAt,
      });
      message.success('Scope updated');
      await load(user);
    } catch (err) {
      setState((prev) => ({ ...prev, saving: false }));
      message.error(err instanceof Error ? err.message : 'Save failed');
    }
  }, [user, state, load]);

  return {
    state,
    toggleCode,
    save,
    reset,
    openScopeEditor,
    closeScopeEditor,
    updateScopeForm,
    saveScope,
  };
};
