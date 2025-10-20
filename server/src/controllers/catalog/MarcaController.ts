import type { Request, Response } from 'express';

import MarcaService from '../../services/catalog/MarcaService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const MarcaController = {
  list: async (_req: Request, res: Response) => {
    const marcas = await MarcaService.list();
    res.json({ marcas });
  },

  create: async (req: Request, res: Response) => {
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const marca = await MarcaService.create(descripcion);
      res.status(201).json(marca);
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

    const marca = await MarcaService.update(codigo, descripcion);

    if (!marca) {
      res.status(404).json({ message: 'Marca no encontrada' });
      return;
    }

    res.json(marca);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await MarcaService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Marca no encontrada' });
      return;
    }

    res.status(204).send();
  },
};

export default MarcaController;

