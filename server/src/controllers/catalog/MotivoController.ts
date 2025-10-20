import type { Request, Response } from 'express';

import MotivoService from '../../services/catalog/MotivoService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const MotivoController = {
  list: async (_req: Request, res: Response) => {
    const motivos = await MotivoService.list();
    res.json({ motivos });
  },

  create: async (req: Request, res: Response) => {
    const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (!descripcion) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const motivo = await MotivoService.create(descripcion);
      res.status(201).json(motivo);
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

    const motivo = await MotivoService.update(codigo, descripcion);

    if (!motivo) {
      res.status(404).json({ message: 'Motivo no encontrado' });
      return;
    }

    res.json(motivo);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await MotivoService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Motivo no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default MotivoController;

