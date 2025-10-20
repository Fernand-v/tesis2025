'use client';

import { useCallback } from 'react';

import { apiUrl } from '@/lib/config';
import { useDashboard } from '@/components/dashboard/DashboardContext';

type ReportParams = {
  nombreReporte: string;
  parametros?: Record<string, string | number | boolean | null | undefined>;
};

export const useGenerarReporte = () => {
  const { user } = useDashboard();

  return useCallback(
    async ({ nombreReporte, parametros = {} }: ReportParams) => {
      const token =
        typeof window !== 'undefined' ? window.localStorage.getItem('authToken') ?? undefined : undefined;

      const reporteNombre = nombreReporte.endsWith('.jasper') ? nombreReporte : `${nombreReporte}.jasper`;
      const body = {
        nombreReporte: reporteNombre,
        parametros: {
          P_FORMATO: 'pdf',
          P_FECHA: new Date().toISOString().slice(0, 10),
          P_USUARIO: user?.username ?? 'desconocido',
          P_USUARIO_ID: String(user?.id ?? 0),
          ...parametros,
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Generacion de reporte fallida');
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      window.open(fileUrl, '_blank', 'noopener');

      window.setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60_000);
    },
    [user],
  );
};
