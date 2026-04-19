import { useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';
import { history } from 'umi';
import { adminLogin } from '@/services/auth';
import type { IAdminLoginParams } from '@/services/type';
import { setAuth } from '@/utils/auth';

export default function LoginPage() {
  const [form] = Form.useForm<IAdminLoginParams>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: IAdminLoginParams): Promise<void> => {
    setSubmitting(true);
    try {
      const res = await adminLogin(values);
      if (res.user.role !== 'admin') {
        message.error('Only admin accounts can sign in here');
        return;
      }
      setAuth(res);
      message.success(`Welcome, ${res.user.name}`);
      history.push('/');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card
        className="w-full max-w-md"
        styles={{ body: { padding: 32 } }}
      >
        <div className="mb-6">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-lg mb-1">
            <span>●</span>
            <span>FOTR Admin</span>
          </div>
          <p className="text-sm text-gray-500">
            Sign in with your staff account.
          </p>
        </div>
        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Email is required' }]}
          >
            <Input placeholder="you@fotr.com" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
}
