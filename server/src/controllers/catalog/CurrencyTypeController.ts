import type { Request, Response } from 'express';

import CurrencyTypeService from '../../services/catalog/CurrencyTypeService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const CurrencyTypeController = {
  list: async (_req: Request, res: Response) => {
    const monedas = await CurrencyTypeService.list();
    res.json({ monedas });
  },

  create: async (req: Request, res: Response) => {
    const { denominacion, tasa, simbolo } = req.body as {
      denominacion?: string;
      tasa?: number;
      simbolo?: string;
    };
    const denominacionValue = typeof denominacion === 'string' ? denominacion.trim() : '';
    const simboloValue = typeof simbolo === 'string' ? simbolo.trim() : '';

    if (!denominacionValue) {
      res.status(400).json({ message: 'La denominacion es obligatoria' });
      return;
    }

    if (typeof tasa !== 'number' || Number.isNaN(tasa)) {
      res.status(400).json({ message: 'La tasa debe ser numerica' });
      return;
    }

    if (!simboloValue) {
      res.status(400).json({ message: 'El simbolo es obligatorio' });
      return;
    }

    try {
      const moneda = await CurrencyTypeService.create({ denominacion: denominacionValue, tasa, simbolo: simboloValue });
      res.status(201).json(moneda);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  },

  update: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);
    const { denominacion, tasa, simbolo } = req.body as {
      denominacion?: string;
      tasa?: number;
      simbolo?: string;
    };
    const denominacionValue = typeof denominacion === 'string' ? denominacion.trim() : '';
    const simboloValue = typeof simbolo === 'string' ? simbolo.trim() : '';

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    if (!denominacionValue || typeof tasa !== 'number' || Number.isNaN(tasa) || !simboloValue) {
      res.status(400).json({ message: 'Datos incompletos' });
      return;
    }

    const moneda = await CurrencyTypeService.update(codigo, {
      denominacion: denominacionValue,
      tasa,
      simbolo: simboloValue,
    });

    if (!moneda) {
      res.status(404).json({ message: 'Tipo de moneda no encontrado' });
      return;
    }

    res.json(moneda);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await CurrencyTypeService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Tipo de moneda no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default CurrencyTypeController;
