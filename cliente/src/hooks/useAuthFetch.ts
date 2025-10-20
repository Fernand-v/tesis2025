'use client';

import { useCallback } from 'react';

import { apiUrl } from '@/lib/config';
import { useDashboard } from '@/components/dashboard/DashboardContext';

export const useAuthFetch = () => {
  const { logout } = useDashboard();

  return useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token =
        typeof window !== 'undefined' ? window.localStorage.getItem('authToken') ?? undefined : undefined;

      if (!token) {
        logout();
        throw new Error('Sesion expirada');
      }

      const headers = new Headers(init.headers ?? {});
      if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      headers.set('Authorization', `Bearer ${token}`);

      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Sesion expirada');
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(payload.message ?? 'Operacion no completada');
      }
      return response;
    },
    [logout],
  );
};
