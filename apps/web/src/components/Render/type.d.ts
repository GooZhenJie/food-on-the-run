export interface ISchemaNode {
  name: string;
  props?: Record<string, unknown>;
  children?: ISchemaNode[];
}

export interface IComponentMap {
  [componentName: string]: React.ComponentType<Record<string, unknown>>;
}

/* ---------- Auth schema config (config-driven auth pages) ---------- */

/**
 * Label variants for a form field / checkbox.
 * - Plain string              → "Email"
 * - Label + right-side action → { text: "Password", suffix: { label: "Forgot?", link: "/forgot" } }
 * - Rich inline (checkbox)    → ["I agree to the ", { text: "Terms", link: "/terms" }, "."]
 */
export type TAuthFieldLabel =
  | string
  | { text: string; suffix?: { label: string; link: string } }
  | Array<string | { text: string; link: string }>;

export type TAuthFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'phone'
  | 'checkbox'
  | 'hidden';

export type TAuthRule =
  | { type: 'required'; message: string }
  /** Must evaluate truthy — for boolean checkboxes */
  | { type: 'required_true'; message: string }
  | { type: 'email'; message: string }
  | { type: 'min_length'; min: number; message: string }
  | { type: 'pattern'; pattern: string; flags?: string; message: string }
  /** Custom preset validator referenced by name, e.g. "password_strength" */
  | { type: 'preset'; preset: string; message: string }
  /** Matches the value of another field on the same form */
  | { type: 'match'; field: string; message: string };

export interface IAuthFieldConfig {
  name: string;
  type: TAuthFieldType;
  label?: TAuthFieldLabel;
  placeholder?: string;
  autoComplete?: string;
  /** Show inline success/error icon (antd hasFeedback) */
  hasFeedback?: boolean;
  /** Optional help text shown under the field */
  help?: string;
  rules?: TAuthRule[];
  /** Only applies to 'checkbox'. Default initial value. */
  defaultChecked?: boolean;
  /** When true, empty/whitespace values are stripped from the submit payload (useful for optional phone). */
  stripIfEmpty?: boolean;
  /** When true, normalize to lowercase + trim before submit. */
  normalize?: 'email' | 'trim';
  /** Hide this field from submission — useful for UI-only checkboxes like `agreeTerms`. */
  excludeFromSubmit?: boolean;
}

export interface IAuthFormOnSuccess {
  /** Call setAuth() with the response (register / login responses). */
  storeAuth?: boolean;
  /** antd message.success() text. `{name}` is replaced with the returned user.name. */
  successMessage?: string;
  /** history.push() target after success. */
  redirect?: string;
}

export interface IAuthFormConfig {
  api: string;
  method?: 'POST' | 'PUT';
  submitLabel: string;
  fields: IAuthFieldConfig[];
  onSuccess?: IAuthFormOnSuccess;
}

export interface IAuthPageConfig {
  title: string;
  subtitle?: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export interface IAuthDividerConfig {
  text: string;
}

export interface IOAuthSectionConfig {
  redirect?: string;
}
