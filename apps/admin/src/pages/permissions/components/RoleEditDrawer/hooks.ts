import { useEffect, useMemo, useState } from 'react';
import type { IPermission } from '@/services/roles';

interface IGroupedPermissions {
  resource: string;
  items: IPermission[];
}

const resourceOf = (code: string): string => {
  const idx = code.indexOf(':');
  return idx < 0 ? code : code.slice(0, idx);
};

export const useGroupedPermissions = (
  permissions: IPermission[],
): IGroupedPermissions[] => {
  return useMemo(() => {
    const byResource = new Map<string, IPermission[]>();
    permissions.forEach((p) => {
      const key = resourceOf(p.code);
      const arr = byResource.get(key) ?? [];
      arr.push(p);
      byResource.set(key, arr);
    });
    const out: IGroupedPermissions[] = [];
    Array.from(byResource.keys())
      .sort()
      .forEach((resource) => {
        const items = (byResource.get(resource) ?? []).sort((a, b) =>
          a.code.localeCompare(b.code),
        );
        out.push({ resource, items });
      });
    return out;
  }, [permissions]);
};

export const useEditableRoleState = (
  open: boolean,
  initialName: string,
  initialCodes: string[] | undefined,
) => {
  const [name, setName] = useState<string>(initialName);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setSelected(new Set(initialCodes ?? []));
  }, [open, initialName, initialCodes]);

  const togglePermission = (code: string, checked: boolean): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const toggleResource = (codes: string[], checked: boolean): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => {
        if (checked) next.add(c);
        else next.delete(c);
      });
      return next;
    });
  };

  return {
    name,
    setName,
    selected,
    togglePermission,
    toggleResource,
  };
};
