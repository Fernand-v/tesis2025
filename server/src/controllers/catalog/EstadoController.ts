import type { Request, Response } from 'express';

import EstadoService from '../../services/catalog/EstadoService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const EstadoController = {
  list: async (_req: Request, res: Response) => {
    const estados = await EstadoService.list();
    res.json({ estados });
  },

  create: async (req: Request, res: Response) => {
    const { descripcion } = req.body as { descripcion?: string };
    const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';

    if (!descripcionValue) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const estado = await EstadoService.create(descripcionValue);
      res.status(201).json(estado);
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

    const estado = await EstadoService.update(codigo, descripcionValue);

    if (!estado) {
      res.status(404).json({ message: 'Estado no encontrado' });
      return;
    }

    res.json(estado);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await EstadoService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Estado no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default EstadoController;
