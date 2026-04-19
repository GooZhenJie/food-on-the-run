import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Space,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd';
import { CopyOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import { getPageSchema, publishPageSchema } from '@/services/schemas';
import { PreviewDrawer } from '../PreviewDrawer';
import type {
  IDiffLine,
  IPendingPublish,
  IPublishDrawerProps,
  IPublishFormValues,
  TPublishStep,
} from './type';
import { diffTextLines, stringifyJson, summarizeDiff } from './utils';

const { TextArea } = Input;
const { Dragger } = Upload;

export const PublishDrawer: React.FC<IPublishDrawerProps> = ({
  open,
  initialKey,
  onClose,
  onPublished,
}) => {
  const [form] = Form.useForm<IPublishFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [step, setStep] = useState<TPublishStep>('edit');
  const [diff, setDiff] = useState<IDiffLine[]>([]);
  const [isNewKey, setIsNewKey] = useState(false);
  const [pending, setPending] = useState<IPendingPublish | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ key: initialKey ?? '' });
    }
  }, [open, initialKey, form]);

  const handleCopyKey = async (): Promise<void> => {
    const value = (form.getFieldValue('key') as string | undefined)?.trim();
    if (!value) {
      message.warning('No route key to copy');
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      message.success('Route key copied');
    } catch {
      message.error('Failed to copy route key');
    }
  };

  const handleReadFile = (file: RcFile): boolean => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        JSON.parse(text);
      } catch {
        message.error('Uploaded file is not valid JSON');
        return;
      }
      form.setFieldValue('schemaText', text);
      message.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => message.error('Failed to read file');
    reader.readAsText(file);
    return false;
  };

  const handleReview = async (): Promise<void> => {
    const values = await form.validateFields();
    let parsed: unknown;
    try {
      parsed = JSON.parse(values.schemaText);
    } catch {
      message.error('schema_data must be valid JSON');
      return;
    }

    setReviewing(true);
    let currentData: unknown = null;
    let newKey = false;
    try {
      const existing = await getPageSchema(values.key.trim());
      currentData = existing.schema_data;
    } catch (err) {
      if (initialKey) {
        message.error(
          err instanceof Error ? err.message : 'Failed to load current schema',
        );
        setReviewing(false);
        return;
      }
      newKey = true;
    }
    setReviewing(false);

    setPending({
      key: values.key.trim(),
      schemaData: parsed,
      note: values.note?.trim() || undefined,
    });
    setIsNewKey(newKey);
    setDiff(diffTextLines(stringifyJson(currentData), stringifyJson(parsed)));
    setStep('review');
  };

  const handlePublish = async (): Promise<void> => {
    if (!pending) return;
    setSubmitting(true);
    try {
      const res = await publishPageSchema({
        key: pending.key,
        schema_data: pending.schemaData,
        note: pending.note,
      });
      message.success(
        `Published ${res.schema.key} v${res.schema.current_version}`,
      );
      form.resetFields();
      setStep('edit');
      setDiff([]);
      setIsNewKey(false);
      setPending(null);
      onPublished();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setStep('edit');
    setDiff([]);
    setIsNewKey(false);
    setPending(null);
    onClose();
  };

  const summary = summarizeDiff(diff);
  const hasChanges = summary.added > 0 || summary.removed > 0;

  return (
    <Drawer
      title={step === 'edit' ? 'Publish page schema' : 'Review changes'}
      open={open}
      width={step === 'review' ? 960 : 640}
      onClose={handleClose}
      destroyOnClose
      extra={
        step === 'edit' ? (
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" loading={reviewing} onClick={handleReview}>
              Review
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={() => setStep('edit')}>Back</Button>
            <Button
              icon={<EyeOutlined />}
              disabled={!pending}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!pending || (!isNewKey && !hasChanges)}
              onClick={handlePublish}
            >
              Confirm publish
            </Button>
          </Space>
        )
      }
    >
      <div className={step === 'edit' ? 'block' : 'hidden'}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ key: initialKey ?? '' }}
          preserve
        >
          <Form.Item
            name="key"
            label="Route key"
            rules={[
              { required: true, message: 'Key is required' },
              { pattern: /^\/.+/, message: 'Key must start with /' },
            ]}
          >
            <Input
              placeholder="/home"
              disabled={Boolean(initialKey)}
              suffix={
                <Tooltip title="Copy route key">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={handleCopyKey}
                  />
                </Tooltip>
              }
            />
          </Form.Item>
          <Form.Item label="Upload JSON file">
            <Dragger
              accept="application/json,.json"
              multiple={false}
              showUploadList={false}
              beforeUpload={handleReadFile}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Drop a .json file or click to select
              </p>
              <p className="ant-upload-hint text-xs text-gray-500">
                File contents will fill the editor below
              </p>
            </Dragger>
          </Form.Item>
          <Form.Item
            name="schemaText"
            label="Schema JSON"
            rules={[{ required: true, message: 'schema_data is required' }]}
          >
            <TextArea
              rows={14}
              placeholder='{"type":"PageWrapper","children":[]}'
              className="!font-mono"
            />
          </Form.Item>
          <Form.Item name="note" label="Note (optional)">
            <Input placeholder="Short change summary" />
          </Form.Item>
        </Form>
      </div>
      {step === 'review' ? (
        <div className="flex flex-col gap-4">
          {isNewKey ? (
            <Alert
              showIcon
              type="info"
              message="New route key"
              description="No existing version — the full schema below will be published as v1."
            />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag color="green">+{summary.added} added</Tag>
              <Tag color="red">-{summary.removed} removed</Tag>
              <Tag>{summary.same} unchanged</Tag>
              {!hasChanges ? (
                <span className="text-xs text-gray-500">
                  No changes detected — publish is disabled.
                </span>
              ) : null}
            </div>
          )}
          {diff.length === 0 ? (
            <Empty description="No content" />
          ) : (
            <div className="bg-gray-50 rounded border border-gray-200 text-xs font-mono overflow-auto max-h-[70vh]">
              {diff.map((line, idx) => {
                const bg =
                  line.type === 'add'
                    ? 'bg-green-50 text-green-900'
                    : line.type === 'del'
                    ? 'bg-red-50 text-red-900'
                    : 'bg-white text-gray-700';
                const marker =
                  line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';
                return (
                  <div
                    key={idx}
                    className={`px-3 py-0.5 whitespace-pre ${bg}`}
                  >
                    <span className="inline-block w-4 select-none text-gray-400">
                      {marker}
                    </span>
                    {line.text}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
      <PreviewDrawer
        open={previewOpen}
        title={pending?.key}
        schema={pending?.schemaData}
        onClose={() => setPreviewOpen(false)}
      />
    </Drawer>
  );
};
