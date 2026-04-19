import type { IAuthFormProps } from './type';

export const authFormPropsMock: IAuthFormProps = {
  api: '/api/auth/login',
  method: 'POST',
  submitLabel: 'Sign in',
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'you@example.com',
      autoComplete: 'email',
      normalize: 'email',
      rules: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Please enter a valid email' },
      ],
    },
    {
      name: 'password',
      type: 'password',
      label: {
        text: 'Password',
        suffix: { label: 'Forgot?', link: '/forgot-password' },
      },
      placeholder: '••••••••',
      autoComplete: 'current-password',
      rules: [{ type: 'required', message: 'Password is required' }],
    },
  ],
  onSuccess: {
    storeAuth: true,
    successMessage: 'Welcome back, {name}!',
    redirect: '/',
  },
};
