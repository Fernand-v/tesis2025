import type { Request, Response } from 'express';

import FallaService from '../../services/catalog/FallaService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const FallaController = {
  list: async (_req: Request, res: Response) => {
    const fallas = await FallaService.list();
    res.json({ fallas });
  },

  create: async (req: Request, res: Response) => {
    const { descripcion } = req.body as { descripcion?: string };
    const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';

    if (!descripcionValue) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const falla = await FallaService.create(descripcionValue);
      res.status(201).json(falla);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  },

  update: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);
    const { descripcion } = req.body as { descripcion?: string };
    const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    if (!descripcionValue) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    const falla = await FallaService.update(codigo, descripcionValue);

    if (!falla) {
      res.status(404).json({ message: 'Falla no encontrada' });
      return;
    }

    res.json(falla);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await FallaService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Falla no encontrada' });
      return;
    }

    res.status(204).send();
  },
};

export default FallaController;
