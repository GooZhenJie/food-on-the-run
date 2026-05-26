import { useEffect } from 'react';
import { Button, Drawer, Form, Input, Select, Space } from 'antd';
import type {
  AdminRestaurant,
  RestaurantUpsertBody,
} from '@/services/restaurants';
import {
  CITY_OPTIONS,
  CUISINE_OPTIONS,
  STATUS_SELECT_OPTIONS,
} from '../../config';

interface IRestaurantFormDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  record: AdminRestaurant | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (body: RestaurantUpsertBody) => Promise<void>;
}

export const RestaurantFormDrawer: React.FC<IRestaurantFormDrawerProps> = ({
  open,
  mode,
  record,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<RestaurantUpsertBody>();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && record) {
      form.setFieldsValue({
        name: record.name,
        cuisine: record.cuisine,
        status: record.status,
        ownerEmail: record.ownerEmail,
        ownerName: record.ownerName,
        city: record.city,
        phone: record.phone,
        address: record.address,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'pending', cuisine: CUISINE_OPTIONS[0] });
    }
  }, [open, mode, record, form]);

  const handleSubmit = async (): Promise<void> => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Drawer
      title={mode === 'create' ? 'Add restaurant' : `Edit — ${record?.name ?? ''}`}
      width="min(640px, 100vw)"
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
      <Form<RestaurantUpsertBody>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g. Orange Lantern" />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item name="cuisine" label="Cuisine">
            <Select options={CUISINE_OPTIONS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={STATUS_SELECT_OPTIONS} />
          </Form.Item>
        </div>

        <Form.Item
          name="ownerEmail"
          label="Owner email"
          rules={[
            { required: true, message: 'Owner email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input placeholder="owner@example.com" />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item name="ownerName" label="Owner name">
            <Input placeholder="Jane Doe" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+65 9xxx xxxx" />
          </Form.Item>
        </div>

        <Form.Item name="city" label="City">
          <Select
            options={CITY_OPTIONS.map((c) => ({ value: c, label: c }))}
            showSearch
          />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input.TextArea
            rows={2}
            placeholder="Street, unit, postal code"
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
