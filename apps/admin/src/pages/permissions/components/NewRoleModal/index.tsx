import { Alert, Input, Modal, Select } from 'antd';
import type { INewRoleModalProps } from './type';
import { useNewRoleForm } from './hooks';
import { SELECTABLE_ROLES, ROLE_LABELS } from '../../config';

export const NewRoleModal = ({
  open,
  saving,
  onClose,
  onSubmit,
}: INewRoleModalProps) => {
  const {
    form,
    fullCode,
    suffixValid,
    nameValid,
    canSubmit,
    setPersona,
    setSuffix,
    setName,
  } = useNewRoleForm(open);

  const handleOk = async (): Promise<void> => {
    if (!canSubmit) return;
    await onSubmit({
      code: fullCode,
      name: form.name.trim(),
      persona: form.persona,
    });
  };

  return (
    <Modal
      title="New custom role"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okButtonProps={{ disabled: !canSubmit, loading: saving }}
      okText="Create"
      destroyOnClose
    >
      <Alert
        className="mb-4"
        type="info"
        showIcon
        message="Custom roles live in the DB only. System roles (admin.super, *.default, etc.) remain migration-owned."
      />

      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Persona</div>
        <Select
          value={form.persona}
          onChange={setPersona}
          style={{ width: '100%' }}
          options={SELECTABLE_ROLES.map((role) => ({
            value: role,
            label: ROLE_LABELS[role],
          }))}
        />
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Role code</div>
        <Input
          addonBefore={`${form.persona}.`}
          value={form.suffix}
          onChange={(e) => setSuffix(e.target.value)}
          placeholder="e.g. regional_sg"
          status={form.suffix && !suffixValid ? 'error' : undefined}
        />
        {form.suffix && !suffixValid ? (
          <div className="text-xs text-red-500 mt-1">
            Lowercase letters, digits and underscore; must start with a letter.
          </div>
        ) : (
          <div className="text-xs text-gray-500 mt-1">
            Final code: <code>{fullCode || '—'}</code>
          </div>
        )}
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-1">Display name</div>
        <Input
          value={form.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Regional Ops (Singapore)"
          status={form.name && !nameValid ? 'error' : undefined}
        />
      </div>
    </Modal>
  );
};
