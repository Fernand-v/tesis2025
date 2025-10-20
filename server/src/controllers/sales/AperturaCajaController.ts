import type { Response } from 'express';

import AperturaCajaService from '../../services/sales/AperturaCajaService';
import { AuthenticatedRequest } from '../../middleware/auth';

const parseDetalleInput = (value: unknown): { monedaCodigo: number; cantidad: number } | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const monedaCodigo = Number((value as { monedaCodigo?: unknown }).monedaCodigo);
  const cantidad = Number((value as { cantidad?: unknown }).cantidad);

  if (!Number.isFinite(monedaCodigo) || monedaCodigo <= 0 || !Number.isFinite(cantidad) || cantidad < 0) {
    return null;
  }

  return { monedaCodigo, cantidad };
};

const AperturaCajaController = {
  list: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth || typeof req.auth.sub === 'undefined') {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const userId = Number(req.auth.sub);
    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Token invalido' });
      return;
    }

    const aperturas = await AperturaCajaService.list();
    res.json({ aperturas: aperturas.filter((apertura) => apertura.usuarioCodigo === userId) });
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

    const cajaCodigo = Number(req.body?.cajaCodigo ?? NaN);
    const estadoCodigo = Number(req.body?.estadoCodigo ?? NaN);
    const detallesRaw: unknown[] = Array.isArray(req.body?.detalles) ? req.body.detalles : [];
    const detalles = detallesRaw
      .map(parseDetalleInput)
      .filter((detalle): detalle is { monedaCodigo: number; cantidad: number } => detalle !== null);

    if (!Number.isFinite(cajaCodigo) || cajaCodigo <= 0) {
      res.status(400).json({ message: 'Selecciona una caja valida' });
      return;
    }

    if (!Number.isFinite(estadoCodigo) || estadoCodigo <= 0) {
      res.status(400).json({ message: 'Selecciona un estado valido' });
      return;
    }

    try {
      const apertura = await AperturaCajaService.create({
        cajaCodigo: Number(cajaCodigo),
        estadoCodigo: Number(estadoCodigo),
        detalles,
        usuarioCodigo,
      });
      res.status(201).json(apertura);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  },
};

export default AperturaCajaController;
