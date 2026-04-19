import type { ISchemaNode } from '@/components/Render/type';

/**
 * Dev-time fallback schema for the sign-up page.
 * In production the schema is fetched from the admin-published backend;
 * this local copy is only used when that fetch fails (offline, backend down,
 * or running without the admin service).
 */
export const SIGN_UP_PAGE_SCHEMA: ISchemaNode = {
  name: 'AuthPage',
  props: {
    title: 'Create your account',
    subtitle: 'Sign up in seconds and start ordering your favourites.',
    footerText: 'Already have an account?',
    footerLinkText: 'Sign in',
    footerLinkTo: '/login',
  },
  children: [
    {
      name: 'AuthForm',
      props: {
        api: '/api/auth/register',
        method: 'POST',
        submitLabel: 'Create account',
        fields: [
          {
            name: 'name',
            type: 'text',
            label: 'Full name',
            placeholder: 'Your name',
            autoComplete: 'name',
            normalize: 'trim',
            rules: [
              { type: 'required', message: 'Please enter your name' },
              { type: 'min_length', min: 2, message: 'Name must be at least 2 characters' },
            ],
          },
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
            name: 'phone',
            type: 'phone',
            label: 'Phone (optional)',
            placeholder: '+60 12 345 6789',
            autoComplete: 'tel',
            stripIfEmpty: true,
            rules: [
              {
                type: 'pattern',
                pattern: '^[+\\d][\\d\\s-]{6,}$',
                message: 'Please enter a valid phone number',
              },
            ],
          },
          {
            name: 'password',
            type: 'password',
            label: 'Password',
            placeholder: 'Create a password',
            autoComplete: 'new-password',
            hasFeedback: true,
            rules: [
              { type: 'required', message: 'Please enter a password' },
              {
                type: 'preset',
                preset: 'password_strength',
                message: 'Min 8 chars, with at least 1 letter and 1 number',
              },
            ],
          },
          {
            name: 'confirmPassword',
            type: 'password',
            label: 'Confirm password',
            placeholder: 'Re-enter your password',
            autoComplete: 'new-password',
            hasFeedback: true,
            excludeFromSubmit: true,
            rules: [
              { type: 'required', message: 'Please confirm your password' },
              { type: 'match', field: 'password', message: 'Passwords do not match' },
            ],
          },
          {
            name: 'agreeTerms',
            type: 'checkbox',
            excludeFromSubmit: true,
            label: [
              'I agree to the ',
              { text: 'Terms of Service', link: '/terms' },
              ' and ',
              { text: 'Privacy Policy', link: '/privacy' },
              '.',
            ],
            rules: [
              { type: 'required_true', message: 'You must agree to the terms' },
            ],
          },
        ],
        onSuccess: {
          storeAuth: true,
          successMessage: 'Welcome, {name}!',
          redirect: '/',
        },
      },
    },
    { name: 'AuthDivider', props: { text: 'or continue with' } },
    { name: 'OAuthSection', props: { redirect: '/' } },
  ],
};
