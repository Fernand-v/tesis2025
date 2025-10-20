import type { Request, Response } from 'express';

import CajaService from '../../services/catalog/CajaService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const CajaController = {
  list: async (_req: Request, res: Response) => {
    const cajas = await CajaService.list();
    res.json({ cajas });
  },

  create: async (req: Request, res: Response) => {
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const caja = await CajaService.create(descripcion);
      res.status(201).json(caja);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  },

  update: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    const caja = await CajaService.update(codigo, descripcion);

    if (!caja) {
      res.status(404).json({ message: 'Caja no encontrada' });
      return;
    }

    res.json(caja);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await CajaService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Caja no encontrada' });
      return;
    }

    res.status(204).send();
  },
};

export default CajaController;

