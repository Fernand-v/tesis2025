import type { Request, Response } from 'express';

import CategoriaIvaService from '../../services/catalog/CategoriaIvaService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const CategoriaIvaController = {
  list: async (_req: Request, res: Response) => {
    const categorias = await CategoriaIvaService.list();
    res.json({ categorias });
  },

  create: async (req: Request, res: Response) => {
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
    const tasaValue = typeof req.body?.tasa === 'number' ? req.body.tasa : Number(req.body?.tasa ?? NaN);

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    if (!Number.isFinite(tasaValue) || tasaValue < 0) {
      res.status(400).json({ message: 'La tasa debe ser un numero positivo' });
      return;
    }

    try {
      const categoria = await CategoriaIvaService.create(descripcion, Number(tasaValue));
      res.status(201).json(categoria);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  },

  update: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
    const tasaValue = typeof req.body?.tasa === 'number' ? req.body.tasa : Number(req.body?.tasa ?? NaN);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    if (!Number.isFinite(tasaValue) || tasaValue < 0) {
      res.status(400).json({ message: 'La tasa debe ser un numero positivo' });
      return;
    }

    const categoria = await CategoriaIvaService.update(codigo, descripcion, Number(tasaValue));

    if (!categoria) {
      res.status(404).json({ message: 'Categoria no encontrada' });
      return;
    }

    res.json(categoria);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await CategoriaIvaService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Categoria no encontrada' });
      return;
    }

    res.status(204).send();
  },
};

export default CategoriaIvaController;

