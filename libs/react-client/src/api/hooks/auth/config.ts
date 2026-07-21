import { useEffect, useMemo } from 'react';
import { IAuthConfig } from 'src/index';
import { getScopedSessionStorageItem } from 'src/storage';

import { useApi } from '../api';
import { useAuthState } from './state';

export const useAuthConfig = () => {
  const token = getScopedSessionStorageItem('chainlit_token') || '';
  const { authConfig, setAuthConfig } = useAuthState();
  const headers = useMemo<Record<string, string>>(() => {
    const nextHeaders: Record<string, string> = {};

    if (token) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }

    return nextHeaders;
  }, [token]);
  const { data: authConfigData, isLoading } = useApi<IAuthConfig>(
    authConfig ? null : '/auth/config',
    { headers }
  );

  useEffect(() => {
    if (authConfigData) {
      setAuthConfig(authConfigData);
    }
  }, [authConfigData, setAuthConfig]);

  return { authConfig, isLoading };
};
