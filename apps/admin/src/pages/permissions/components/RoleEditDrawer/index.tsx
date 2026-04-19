import { Alert, Button, Checkbox, Drawer, Input, Space, Tag } from 'antd';
import type { IRoleEditDrawerProps } from './type';
import { useEditableRoleState, useGroupedPermissions } from './hooks';

export const RoleEditDrawer = ({
  open,
  role,
  allPermissions,
  saving,
  onClose,
  onSave,
}: IRoleEditDrawerProps) => {
  const grouped = useGroupedPermissions(allPermissions);
  const { name, setName, selected, togglePermission, toggleResource } =
    useEditableRoleState(open, role?.name ?? '', role?.permission_codes);

  const handleSave = async (): Promise<void> => {
    if (!role) return;
    const ok = await onSave(name, Array.from(selected));
    if (ok) onClose();
  };

  const selectedCount = selected.size;

  return (
    <Drawer
      title={
        role ? (
          <span>
            Edit role — <code className="text-sm">{role.code}</code>
          </span>
        ) : (
          'Edit role'
        )
      }
      width="min(560px, 100vw)"
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </Space>
      }
    >
      {role ? (
        <>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Code (immutable)</div>
            <code className="text-sm">{role.code}</code>
            <span className="ml-2">
              <Tag color="orange">{role.persona}</Tag>
              {role.is_system ? (
                <Tag color="geekblue">system</Tag>
              ) : (
                <Tag color="default">custom</Tag>
              )}
            </span>
          </div>

          <div className="mb-5">
            <div className="text-xs text-gray-500 mb-1">Display name</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
            />
          </div>

          <Alert
            className="mb-4"
            type="info"
            showIcon
            message="Changes take effect on each user's next token refresh (up to 1 hour)."
          />

          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">Permissions</div>
            <span className="text-xs text-gray-500">
              {selectedCount} selected · {allPermissions.length} total
            </span>
          </div>

          <div className="space-y-4">
            {grouped.map(({ resource, items }) => {
              const codes = items.map((p) => p.code);
              const allChecked = codes.every((c) => selected.has(c));
              const someChecked =
                !allChecked && codes.some((c) => selected.has(c));
              return (
                <div
                  key={resource}
                  className="border border-gray-200 rounded-md p-3"
                >
                  <label className="flex items-center cursor-pointer mb-2">
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={(e) => toggleResource(codes, e.target.checked)}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900 uppercase">
                      {resource}
                    </span>
                  </label>
                  <div className="pl-6 grid grid-cols-1 gap-1">
                    {items.map((p) => (
                      <label
                        key={p.code}
                        className="flex items-start cursor-pointer"
                      >
                        <Checkbox
                          checked={selected.has(p.code)}
                          onChange={(e) =>
                            togglePermission(p.code, e.target.checked)
                          }
                        />
                        <div className="ml-2 flex-1">
                          <code className="text-xs font-medium text-gray-900">
                            {p.code}
                          </code>
                          {p.description ? (
                            <div className="text-xs text-gray-500">
                              {p.description}
                            </div>
                          ) : null}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </Drawer>
  );
};
