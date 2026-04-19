import React, { useState } from 'react';
import { history, Link } from 'umi';
import { App, Button, Checkbox, Form, Input } from 'antd';
import type { FormInstance, Rule } from 'antd/es/form';
import { setAuth, validatePassword } from '@/utils/auth';
import type { IAuthResponse } from '@/services/type';
import type {
  IAuthFieldConfig,
  IAuthFormOnSuccess,
  TAuthFieldLabel,
  TAuthRule,
} from '../../type';
import type { IAuthFormApiResponse, IAuthFormProps } from './type';

/**
 * Compiles a JSON rule into an antd Form Rule.
 * All rule types are pure data — the preset/matcher lookups happen here.
 */
const compileRule = (
  rule: TAuthRule,
  form: FormInstance,
): Rule => {
  switch (rule.type) {
    case 'required':
      return { required: true, message: rule.message };
    case 'required_true':
      return {
        validator: (_r, value: unknown) =>
          value ? Promise.resolve() : Promise.reject(new Error(rule.message)),
      };
    case 'email':
      return { type: 'email', message: rule.message };
    case 'min_length':
      return { min: rule.min, message: rule.message };
    case 'pattern':
      return {
        pattern: new RegExp(rule.pattern, rule.flags),
        message: rule.message,
      };
    case 'preset':
      if (rule.preset === 'password_strength') {
        return {
          validator: (_r, value: string) => {
            if (!value || validatePassword(value)) return Promise.resolve();
            return Promise.reject(new Error(rule.message));
          },
        };
      }
      return { message: `Unknown preset: ${rule.preset}` };
    case 'match':
      return {
        validator: (_r, value: string) => {
          if (!value || form.getFieldValue(rule.field) === value) {
            return Promise.resolve();
          }
          return Promise.reject(new Error(rule.message));
        },
      };
    default:
      return {};
  }
};

const compileRules = (
  rules: TAuthRule[] | undefined,
  form: FormInstance,
): Rule[] => (rules || []).map((r) => compileRule(r, form));

/** Renders a field label that may carry a right-aligned suffix link. */
const renderLabel = (label: TAuthFieldLabel | undefined): React.ReactNode => {
  if (!label) return undefined;
  if (typeof label === 'string') return label;
  if (Array.isArray(label)) {
    return (
      <>
        {label.map((seg, i) =>
          typeof seg === 'string' ? (
            <React.Fragment key={i}>{seg}</React.Fragment>
          ) : (
            <a
              key={i}
              href={seg.link}
              target="_blank"
              rel="noreferrer"
              className="text-orange-600 font-medium hover:text-orange-700"
            >
              {seg.text}
            </a>
          ),
        )}
      </>
    );
  }
  if (label.suffix) {
    return (
      <div className="flex items-center justify-between w-full">
        <span>{label.text}</span>
        <Link
          to={label.suffix.link}
          className="text-[13px] font-medium text-orange-600 hover:text-orange-700"
        >
          {label.suffix.label}
        </Link>
      </div>
    );
  }
  return label.text;
};

/** Transforms form values into the POST payload based on per-field config. */
const buildSubmitPayload = (
  values: Record<string, unknown>,
  fields: IAuthFieldConfig[],
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.excludeFromSubmit) continue;
    const raw = values[f.name];
    let v: unknown = raw;
    if (typeof raw === 'string') {
      if (f.normalize === 'email') v = raw.trim().toLowerCase();
      else if (f.normalize === 'trim') v = raw.trim();
    }
    if (f.stripIfEmpty && (v === '' || v === undefined || v === null)) continue;
    out[f.name] = v;
  }
  return out;
};

const runOnSuccess = (
  data: IAuthFormApiResponse,
  cfg: IAuthFormOnSuccess | undefined,
  messageApi: { success: (content: string) => void },
) => {
  if (!cfg) return;
  if (cfg.storeAuth) {
    setAuth(data as unknown as IAuthResponse);
  }
  if (cfg.successMessage) {
    const text = cfg.successMessage.replace(
      '{name}',
      data.user?.name ?? '',
    );
    messageApi.success(text);
  }
  if (cfg.redirect) history.push(cfg.redirect);
};

const renderField = (field: IAuthFieldConfig) => {
  switch (field.type) {
    case 'password':
      return (
        <Input.Password
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
        />
      );
    case 'checkbox':
      return <Checkbox>{renderLabel(field.label)}</Checkbox>;
    case 'hidden':
      return <Input type="hidden" />;
    case 'email':
      return (
        <Input
          type="email"
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
        />
      );
    case 'phone':
      return (
        <Input
          type="tel"
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
        />
      );
    case 'text':
    default:
      return (
        <Input
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
        />
      );
  }
};

export const AuthForm: React.FC<IAuthFormProps> = ({
  api = '',
  method = 'POST',
  submitLabel = 'Submit',
  fields = [],
  onSuccess,
}) => {
  const [form] = Form.useForm<Record<string, unknown>>();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const initialValues: Record<string, unknown> = {};
  fields.forEach((f) => {
    if (f.type === 'checkbox' && f.defaultChecked) {
      initialValues[f.name] = true;
    }
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload = buildSubmitPayload(values, fields);
      const res = await fetch(api, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
          else if (err?.message) msg = err.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const data: IAuthFormApiResponse = res.status === 204 ? {} : await res.json();
      runOnSuccess(data, onSuccess, message);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      size="large"
      requiredMark={false}
      onFinish={handleSubmit}
      initialValues={initialValues}
      disabled={submitting}
      scrollToFirstError
    >
      {fields.map((field) => {
        const hasLabelSuffix =
          typeof field.label === 'object' &&
          !Array.isArray(field.label) &&
          Boolean(field.label?.suffix);

        const isCheckbox = field.type === 'checkbox';
        const isHidden = field.type === 'hidden';

        const commonProps = {
          name: field.name,
          dependencies:
            field.rules?.some((r) => r.type === 'match')
              ? [
                  ...field.rules
                    .filter((r): r is Extract<TAuthRule, { type: 'match' }> => r.type === 'match')
                    .map((r) => r.field),
                ]
              : undefined,
          rules: compileRules(field.rules, form),
          hasFeedback: field.hasFeedback,
          help: field.help,
        };

        if (isHidden) {
          return <Form.Item key={field.name} {...commonProps} noStyle>{renderField(field)}</Form.Item>;
        }

        if (isCheckbox) {
          return (
            <Form.Item
              key={field.name}
              {...commonProps}
              valuePropName="checked"
            >
              {renderField(field)}
            </Form.Item>
          );
        }

        return (
          <Form.Item
            key={field.name}
            {...commonProps}
            label={renderLabel(field.label)}
            className={
              hasLabelSuffix
                ? '[&_.ant-form-item-label]:!w-full [&_.ant-form-item-label>label]:!w-full [&_.ant-form-item-label>label]:!flex'
                : undefined
            }
          >
            {renderField(field)}
          </Form.Item>
        );
      })}

      <Form.Item className="!mb-0">
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={submitting}
        >
          {submitLabel}
        </Button>
      </Form.Item>
    </Form>
  );
};
