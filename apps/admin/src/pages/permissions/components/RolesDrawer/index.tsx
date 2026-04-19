import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Switch,
  Tag,
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { IRolesDrawerProps } from './type';
import { useRolesDrawer } from './hooks';
import {
  formatExpiresForDisplay,
  fromDatetimeLocal,
  toDatetimeLocal,
} from '../UserGrantsDrawer/utils';

export const RolesDrawer = ({
  open,
  user,
  onClose,
  onSaved,
}: IRolesDrawerProps) => {
  const {
    state,
    toggleCode,
    save,
    openScopeEditor,
    closeScopeEditor,
    updateScopeForm,
    saveScope,
  } = useRolesDrawer(user, open, onSaved);

  const assignmentByRoleCode = new Map(
    state.assignments.map((a) => [a.code, a]),
  );

  const handleSave = async (): Promise<void> => {
    try {
      await save();
    } catch {
      // message handled in hook
    }
  };

  return (
    <>
      <Drawer
        title={user ? `Assign roles — ${user.name}` : 'Assign roles'}
        width="min(560px, 100vw)"
        open={open}
        onClose={onClose}
        extra={
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              loading={state.saving}
              disabled={state.loading}
              onClick={handleSave}
            >
              Save
            </Button>
          </Space>
        }
      >
        {state.loading ? (
          <div className="py-12 flex justify-center">
            <Spin />
          </div>
        ) : (
          <>
            {user ? (
              <div className="mb-5 text-sm text-gray-600">
                <span className="mr-2">Persona:</span>
                <Tag color="orange">{user.role}</Tag>
                <div className="mt-1 text-xs text-gray-500">
                  Only roles scoped to this persona are shown.
                </div>
              </div>
            ) : null}

            {state.persona === 'merchant' && state.scope ? (
              <div className="mb-5 border border-gray-200 rounded-md p-3 bg-gray-50">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Owns {state.scope.restaurants.length} restaurant
                  {state.scope.restaurants.length === 1 ? '' : 's'}
                </div>
                {state.scope.restaurants.length === 0 ? (
                  <div className="text-xs text-gray-500">
                    No restaurants yet. Set{' '}
                    <code className="text-xs">restaurants.owner_id</code> to
                    this user to grant scope.
                  </div>
                ) : (
                  <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
                    {state.scope.restaurants.map((rest) => (
                      <li key={rest.id}>
                        <span>{rest.name}</span>{' '}
                        <span className="text-gray-400">(id {rest.id})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <Alert
              className="mb-5"
              type="warning"
              showIcon
              message="Changes take effect on the user's next token refresh (up to 1 hour)."
            />

            {state.availableRoles.length === 0 ? (
              <Empty description="No roles defined for this persona yet" />
            ) : (
              <div className="space-y-3">
                {state.availableRoles.map((role) => {
                  const checked = state.selectedCodes.includes(role.code);
                  const assigned = assignmentByRoleCode.get(role.code);
                  const hasScope = Boolean(
                    assigned?.scope?.restaurant_ids?.length,
                  );
                  const hasExpiry = Boolean(assigned?.expires_at);
                  return (
                    <div
                      key={role.code}
                      className="border border-gray-200 rounded-md p-3"
                    >
                      <label className="flex items-start cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onChange={(e) =>
                            toggleCode(role.code, e.target.checked)
                          }
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <code className="text-sm font-medium text-gray-900">
                              {role.code}
                            </code>
                            <span className="ml-2 text-sm text-gray-500">
                              {role.name}
                            </span>
                            {role.is_system ? (
                              <Tag className="ml-2" color="geekblue">
                                system
                              </Tag>
                            ) : null}
                            {hasScope ? (
                              <Tag className="ml-2" color="purple">
                                scoped
                              </Tag>
                            ) : null}
                            {hasExpiry ? (
                              <Tag className="ml-2" color="orange">
                                expires
                              </Tag>
                            ) : null}
                          </div>
                          {role.permission_codes &&
                          role.permission_codes.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {role.permission_codes.map((p) => (
                                <Tag key={p} className="text-xs">
                                  {p}
                                </Tag>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-gray-400">
                              No permissions attached
                            </div>
                          )}
                          {checked && assigned ? (
                            <div className="mt-2 text-xs text-gray-500">
                              {hasScope ? (
                                <span className="mr-3">
                                  Scope: rids [
                                  {assigned.scope?.restaurant_ids?.join(', ')}]
                                </span>
                              ) : (
                                <span className="mr-3">Scope: global</span>
                              )}
                              {hasExpiry ? (
                                <span className="mr-3">
                                  Expires:{' '}
                                  {formatExpiresForDisplay(
                                    assigned.expires_at as string,
                                  )}
                                </span>
                              ) : (
                                <span className="mr-3">Expires: never</span>
                              )}
                              <Button
                                type="link"
                                size="small"
                                icon={<SettingOutlined />}
                                onClick={() => openScopeEditor(assigned)}
                                disabled={role.code === 'admin.super'}
                              >
                                Scope / expires
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="Scope & expiry"
        open={Boolean(state.scopeEditing)}
        onCancel={closeScopeEditor}
        onOk={async () => {
          await saveScope();
          closeScopeEditor();
        }}
        okButtonProps={{ loading: state.saving }}
        okText="Save"
        destroyOnClose
      >
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="Leave scope disabled for global effect. admin.super cannot be scoped."
        />

        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Scope restriction</div>
          <Space>
            <Switch
              checked={state.scopeForm.enabled}
              onChange={(checked) => updateScopeForm({ enabled: checked })}
            />
            <span className="text-xs text-gray-500">
              {state.scopeForm.enabled
                ? 'Limit to the listed restaurants'
                : 'Global (applies to all resources)'}
            </span>
          </Space>
          {state.scopeForm.enabled ? (
            <div className="mt-2">
              <Input
                placeholder="Restaurant IDs, comma separated e.g. 101,102"
                value={state.scopeForm.restaurantIdsInput}
                onChange={(e) =>
                  updateScopeForm({ restaurantIdsInput: e.target.value })
                }
              />
            </div>
          ) : null}
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">
            Expires (optional, local time)
          </div>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
            value={toDatetimeLocal(state.scopeForm.expiresAt)}
            onChange={(e) =>
              updateScopeForm({ expiresAt: fromDatetimeLocal(e.target.value) })
            }
          />
        </div>
      </Modal>
    </>
  );
};
