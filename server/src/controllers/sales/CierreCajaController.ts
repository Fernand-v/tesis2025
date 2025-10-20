import type { Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth';
import CierreCajaService, { CierreCajaAlreadyExistsError } from '../../services/sales/CierreCajaService';
import {
  AperturaInactivaError,
  AperturaOwnerMismatchError,
} from '../../services/sales/ArqueoCajaService';
import { CajaAperturaRequiredError } from '../../services/sales/PedidoVentaService';
import { logRequestEvent } from '../../utils/logger';

type DetalleParsed = { monedaCodigo: number; cantidad: number };

const parseDetalleInput = (value: unknown): DetalleParsed | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const monedaCodigo = Number((value as { monedaCodigo?: unknown }).monedaCodigo);
  const cantidad = Number((value as { cantidad?: unknown }).cantidad);

  if (!Number.isFinite(monedaCodigo) || monedaCodigo <= 0) {
    return null;
  }

  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return null;
  }

  return { monedaCodigo, cantidad };
};

const CierreCajaController = {
  list: async (req: AuthenticatedRequest, res: Response) => {
    const mine = req.query.mine === 'true';
    let usuarioCodigo: number | null = null;

    if (mine) {
      if (!req.auth || typeof req.auth.sub === 'undefined') {
        res.status(401).json({ message: 'No autorizado' });
        return;
      }

      usuarioCodigo = Number(req.auth.sub);
      if (Number.isNaN(usuarioCodigo)) {
        res.status(400).json({ message: 'Token invalido' });
        return;
      }
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

    const cierres = await CierreCajaService.list({ usuarioCodigo, aperturaCodigo });
    res.json({ cierres });
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
      const resumen = await CierreCajaService.obtenerResumenDisponible(usuarioCodigo, aperturaCodigo);
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
      if (error instanceof AperturaInactivaError) {
        res.status(409).json({ message: error.message });
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

    const detallesRaw: unknown[] = Array.isArray(req.body?.detalles) ? req.body.detalles : [];
    const detalles = detallesRaw
      .map(parseDetalleInput)
      .filter((detalle): detalle is DetalleParsed => detalle !== null);

    if (detalles.length === 0) {
      res.status(400).json({ message: 'Debes ingresar al menos una moneda con cantidad mayor o igual a cero' });
      return;
    }

    try {
      const cierre = await CierreCajaService.create({
        aperturaCodigo,
        usuarioCodigo,
        detalles,
      });
      res.status(201).json(cierre);
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

      if (error instanceof CierreCajaAlreadyExistsError) {
        res.status(409).json({ message: error.message });
        return;
      }

      const message = (error as Error).message;
      if (message.includes('moneda') || message.includes('cantidad')) {
        res.status(400).json({ message });
        return;
      }

      void logRequestEvent(req, {
        section: 'CIERRE',
        statusCode: 400,
        message: 'No se pudo registrar el cierre',
        detail: message,
        priority: 2,
      });
      res.status(400).json({ message });
    }
  },
};

export default CierreCajaController;
