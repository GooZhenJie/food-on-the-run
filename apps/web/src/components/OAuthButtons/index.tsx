import React, { useState } from 'react';
import { App } from 'antd';
import { GoogleOutlined, AppleFilled, FacebookFilled } from '@ant-design/icons';
import { oauthLogin } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { IAuthResponse, TOAuthProvider } from '@/services/type';

interface IOAuthButtonsProps {
  onSuccess?: (payload: IAuthResponse) => void;
  disabled?: boolean;
}

const PROVIDERS: {
  key: TOAuthProvider;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
}[] = [
  {
    key: 'google',
    label: 'Google',
    icon: <GoogleOutlined />,
    iconColor: 'text-[#EA4335]',
  },
  {
    key: 'apple',
    label: 'Apple',
    icon: <AppleFilled />,
    iconColor: 'text-gray-900',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <FacebookFilled />,
    iconColor: 'text-[#1877F2]',
  },
];

export const OAuthButtons: React.FC<IOAuthButtonsProps> = ({
  onSuccess,
  disabled,
}) => {
  const [loadingProvider, setLoadingProvider] = useState<TOAuthProvider | null>(null);
  const { message } = App.useApp();
  const { login } = useAuth();

  const handleClick = async (provider: TOAuthProvider) => {
    setLoadingProvider(provider);
    try {
      const payload = await oauthLogin(provider, { id_token: 'mock_id_token' });
      login(payload);
      message.success(`Signed in with ${provider}`);
      onSuccess?.(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OAuth sign-in failed';
      message.error(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {PROVIDERS.map((p) => {
        const isBusy = loadingProvider === p.key;
        const isDisabled =
          disabled || (loadingProvider !== null && loadingProvider !== p.key);
        return (
          <button
            key={p.key}
            type="button"
            aria-label={`Continue with ${p.label}`}
            disabled={isDisabled}
            onClick={() => handleClick(p.key)}
            className="h-[52px] rounded-2xl border border-gray-200 bg-white flex items-center justify-center gap-2 text-[15px] font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <span className={`text-lg ${p.iconColor}`}>
              {isBusy ? (
                <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                p.icon
              )}
            </span>
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
};
