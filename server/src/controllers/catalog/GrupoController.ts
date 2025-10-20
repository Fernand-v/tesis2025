import type { Request, Response } from 'express';

import GrupoService from '../../services/catalog/GrupoService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const GrupoController = {
  list: async (_req: Request, res: Response) => {
    const grupos = await GrupoService.list();
    res.json({ grupos });
  },

  create: async (req: Request, res: Response) => {
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const grupo = await GrupoService.create(descripcion);
      res.status(201).json(grupo);
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

    const grupo = await GrupoService.update(codigo, descripcion);

    if (!grupo) {
      res.status(404).json({ message: 'Grupo no encontrado' });
      return;
    }

    res.json(grupo);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await GrupoService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Grupo no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default GrupoController;

