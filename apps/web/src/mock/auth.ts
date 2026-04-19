import type { IAuthResponse, IAuthUser } from '../services/type';

interface IMockRequest {
  body?: Record<string, unknown>;
  params: Record<string, string>;
}

interface IMockResponse {
  status: (code: number) => IMockResponse;
  json: (body: unknown) => IMockResponse;
  end: () => IMockResponse;
}

const buildAuthResponse = (user: IAuthUser): IAuthResponse => ({
  user,
  access_token: `mock_access_${user.id}_${Date.now()}`,
  refresh_token: `mock_refresh_${user.id}_${Date.now()}`,
  expires_in: 3600,
});

export const mockOAuth = (req: IMockRequest, res: IMockResponse) => {
  const provider = req.params.provider;
  const allowed = ['google', 'apple', 'facebook'];
  if (!allowed.includes(provider)) {
    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  }

  const oauthUser: IAuthUser = {
    id: `u_oauth_${provider}`,
    name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
    email: `${provider}@fotr.com`,
    role: 'customer',
  };

  return res.status(200).json(buildAuthResponse(oauthUser));
};

export const mockForgotPassword = (req: IMockRequest, res: IMockResponse) => {
  const { email } = (req.body || {}) as { email?: string };
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  return res.status(204).end();
};
