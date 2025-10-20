import type { Request, Response } from 'express';

import ProgramTypeService from '../../services/catalog/ProgramTypeService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const ProgramTypeController = {
  list: async (_req: Request, res: Response) => {
    const tipos = await ProgramTypeService.list();
    res.json({ tipos });
  },

  create: async (req: Request, res: Response) => {
    const { descripcion } = req.body as { descripcion?: string };
    const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';

    if (!descripcionValue) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const tipo = await ProgramTypeService.create(descripcionValue);
      res.status(201).json(tipo);
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

    const tipo = await ProgramTypeService.update(codigo, descripcionValue);

    if (!tipo) {
      res.status(404).json({ message: 'Tipo de programa no encontrado' });
      return;
    }

    res.json(tipo);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await ProgramTypeService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Tipo de programa no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default ProgramTypeController;
