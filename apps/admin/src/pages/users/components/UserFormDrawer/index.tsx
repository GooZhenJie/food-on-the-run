import { useEffect } from 'react';
import { Button, Drawer, Form, Input, Select, Space } from 'antd';
import type { AdminUser, AdminUserUpsertBody } from '@/services/users';
import { ROLE_SELECT_OPTIONS } from '../../config';

interface IUserFormDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  record: AdminUser | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (body: AdminUserUpsertBody) => Promise<void>;
}

export const UserFormDrawer: React.FC<IUserFormDrawerProps> = ({
  open,
  mode,
  record,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<AdminUserUpsertBody>();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && record) {
      form.setFieldsValue({
        name: record.name,
        email: record.email,
        phone: record.phone,
        role: record.role,
        status: record.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ role: 'customer', status: 'active' });
    }
  }, [open, mode, record, form]);

  const handleSubmit = async (): Promise<void> => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Drawer
      title={mode === 'create' ? 'Add user' : `Edit — ${record?.name ?? ''}`}
      width="min(560px, 100vw)"
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </Space>
      }
    >
      <Form<AdminUserUpsertBody>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="Jane Doe" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input placeholder="jane@example.com" />
        </Form.Item>
        <Form.Item name="phone" label="Phone">
          <Input placeholder="+65 9xxx xxxx" />
        </Form.Item>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item name="role" label="Role">
            <Select options={ROLE_SELECT_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'banned', label: 'Banned' },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};
