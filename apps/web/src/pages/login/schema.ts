import type { ISchemaNode } from '@/components/Render/type';

/**
 * Dev-time fallback schema for the login page.
 * In production the schema is fetched from the admin-published backend;
 * this local copy is only used when that fetch fails (offline, backend down,
 * or running without the admin service).
 */
export const LOGIN_PAGE_SCHEMA: ISchemaNode = {
  name: 'AuthPage',
  props: {
    title: 'Welcome back',
    subtitle: 'Enter your email and password to continue ordering.',
    footerText: 'New to FoodRun?',
    footerLinkText: 'Create an account',
    footerLinkTo: '/sign-up',
  },
  children: [
    {
      name: 'AuthForm',
      props: {
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
              { type: 'required', message: 'Please enter your email' },
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
            placeholder: 'Enter your password',
            autoComplete: 'current-password',
            rules: [
              { type: 'required', message: 'Please enter your password' },
            ],
          },
        ],
        onSuccess: {
          storeAuth: true,
          successMessage: 'Welcome back, {name}',
          redirect: '/',
        },
      },
    },
    { name: 'AuthDivider', props: { text: 'or continue with' } },
    { name: 'OAuthSection', props: { redirect: '/' } },
  ],
};
