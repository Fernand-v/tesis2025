import type { Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth';
import ArqueoCajaService, {
  AperturaInactivaError,
  AperturaOwnerMismatchError,
  ArqueoAlreadyRegisteredError,
  ArqueoSaldoMismatchError,
} from '../../services/sales/ArqueoCajaService';
import { CajaAperturaRequiredError } from '../../services/sales/PedidoVentaService';
import { logRequestEvent } from '../../utils/logger';

type DetalleInputParsed = { monedaCodigo: number; cantidad: number };

const parseDetalleInput = (value: unknown): DetalleInputParsed | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const monedaCodigo = Number((value as { monedaCodigo?: unknown }).monedaCodigo);
  const cantidad = Number((value as { cantidad?: unknown }).cantidad);

  if (!Number.isFinite(monedaCodigo) || monedaCodigo <= 0) {
    return null;
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return null;
  }

  return { monedaCodigo, cantidad };
};

const ArqueoCajaController = {
  list: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth || typeof req.auth.sub === 'undefined') {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const usuarioCodigo = Number(req.auth.sub);
    if (Number.isNaN(usuarioCodigo)) {
      res.status(400).json({ message: 'Token invalido' });
      return;
    }

    const aperturaParam = req.query.apertura;
    let aperturaCodigo: number | null = null;
    if (typeof aperturaParam === 'string' && aperturaParam.trim() !== '') {
      const parsed = Number(aperturaParam);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        res.status(400).json({ message: 'Parametro apertura invalido' });
        return;
      }
      aperturaCodigo = parsed;
    }

    const arqueos = await ArqueoCajaService.list({ usuarioCodigo, aperturaCodigo });
    res.json({ arqueos });
  },

  available: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth || typeof req.auth.sub === 'undefined') {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const usuarioCodigo = Number(req.auth.sub);
    if (Number.isNaN(usuarioCodigo)) {
      res.status(400).json({ message: 'Token invalido' });
      return;
    }

    const aperturaParam = req.query.apertura;
    let aperturaCodigo: number | null = null;
    if (typeof aperturaParam === 'string' && aperturaParam.trim() !== '') {
      const parsed = Number(aperturaParam);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        res.status(400).json({ message: 'Parametro apertura invalido' });
        return;
      }
      aperturaCodigo = parsed;
    }

    try {
      const resumen = await ArqueoCajaService.obtenerResumenDisponible(usuarioCodigo, aperturaCodigo);
      res.json(resumen);
    } catch (error) {
      if (error instanceof CajaAperturaRequiredError) {
        res.status(409).json({ message: error.message });
        return;
      }
      if (error instanceof AperturaOwnerMismatchError) {
        res.status(403).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: (error as Error).message });
    }
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth || typeof req.auth.sub === 'undefined') {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const usuarioCodigo = Number(req.auth.sub);
    if (Number.isNaN(usuarioCodigo)) {
      res.status(400).json({ message: 'Token invalido' });
      return;
    }

    const aperturaCodigo =
      typeof req.body?.aperturaCodigo === 'number' && Number.isFinite(req.body.aperturaCodigo)
        ? Number(req.body.aperturaCodigo)
        : null;
    const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo : '';

    const detallesRaw: unknown[] = Array.isArray(req.body?.detalles) ? req.body.detalles : [];
    const detalles = detallesRaw
      .map(parseDetalleInput)
      .filter((detalle): detalle is DetalleInputParsed => detalle !== null);

    if (detalles.length === 0) {
      res.status(400).json({ message: 'Debes ingresar al menos una moneda con cantidad mayor a cero' });
      return;
    }

    try {
      const arqueo = await ArqueoCajaService.create({
        aperturaCodigo,
        usuarioCodigo,
        motivo,
        detalles,
      });

      res.status(201).json(arqueo);
    } catch (error) {
      if (error instanceof CajaAperturaRequiredError) {
        res.status(409).json({ message: error.message });
        return;
      }

      if (error instanceof AperturaOwnerMismatchError) {
        res.status(403).json({ message: error.message });
        return;
      }

      if (error instanceof AperturaInactivaError) {
        res.status(409).json({ message: error.message });
        return;
      }

      /*if (error instanceof ArqueoAlreadyRegisteredError) {
        res.status(409).json({ message: error.message });
        return;
      }*/

      if (error instanceof ArqueoSaldoMismatchError) {
        res.status(400).json({
          message: error.message,
          esperado: error.expected,
          contado: error.provided,
          diferencia: error.provided - error.expected,
        });
        return;
      }

      void logRequestEvent(req, {
        section: 'ARQUEO',
        statusCode: 400,
        message: 'No se pudo registrar el arqueo',
        detail: (error as Error).message,
        priority: 2,
      });
      res.status(400).json({ message: (error as Error).message });
    }
  },
};

export default ArqueoCajaController;
