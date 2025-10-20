import { Request, Response } from 'express';

import config from '../../config/env';
import { logRequestEvent } from '../../utils/logger';

type ReportPayload = {
  nombreReporte?: string;
  reporte?: string;
  parametros?: Record<string, string | number | boolean | null | undefined>;
  paramString?: string;
};

const buildFormParams = (payload: ReportPayload): URLSearchParams => {
  const reportBaseName = payload.nombreReporte ?? payload.reporte;

  if (!reportBaseName || typeof reportBaseName !== 'string') {
    throw new Error('Falta el nombre del reporte');
  }

  const nombreArchivo = reportBaseName.endsWith('.jasper') ? reportBaseName : `${reportBaseName}.jasper`;
  const params = new URLSearchParams();
  params.append('reporte', nombreArchivo);

  if (payload.parametros && typeof payload.parametros === 'object') {
    Object.entries(payload.parametros).forEach(([key, value]) => {
      if (value === null || typeof value === 'undefined') {
        return;
      }
      params.append(key, String(value));
    });
  }

  if (typeof payload.paramString === 'string' && payload.paramString.trim() !== '') {
    const extras = new URLSearchParams(payload.paramString);
    extras.forEach((value, key) => {
      if (key !== 'reporte') {
        params.append(key, value);
      }
    });
  }

  return params;
};

const ReportController = {
  generate: async (req: Request, res: Response) => {
    try {
      const payload = (req.body ?? {}) as ReportPayload;
      const params = buildFormParams(payload);
      const reportResponse = await fetch(config.reportService.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!reportResponse.ok) {
        const errorText = await reportResponse.text().catch(() => '');
        void logRequestEvent(req, {
          section: 'REPORT',
          statusCode: reportResponse.status,
          message: 'Generacion de reporte fallida',
          detail: errorText,
          priority: 3,
        });
        res.status(500).json({ message: 'No se pudo generar el reporte' });
        return;
      }

      const arrayBuffer = await reportResponse.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);
      const fileName = (params.get('reporte') ?? 'reporte.jasper').replace(/\.jasper$/i, '.pdf');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(pdfBuffer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo generar el reporte';
      void logRequestEvent(req, {
        section: 'REPORT',
        statusCode: 500,
        message,
        detail: message,
        priority: 3,
      });
      res.status(500).json({ message });
    }
  },
};

export default ReportController;
