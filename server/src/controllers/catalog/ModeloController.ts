import type { Request, Response } from 'express';

import ModeloService from '../../services/catalog/ModeloService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const ModeloController = {
  list: async (_req: Request, res: Response) => {
    const modelos = await ModeloService.list();
    res.json({ modelos });
  },

  create: async (req: Request, res: Response) => {
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const modelo = await ModeloService.create(descripcion);
      res.status(201).json(modelo);
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

    const modelo = await ModeloService.update(codigo, descripcion);

    if (!modelo) {
      res.status(404).json({ message: 'Modelo no encontrado' });
      return;
    }

    res.json(modelo);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await ModeloService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Modelo no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default ModeloController;

