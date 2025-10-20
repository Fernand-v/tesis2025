import type { Request, Response } from 'express';

import CajaUsuarioService from '../../services/catalog/CajaUsuarioService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const CajaUsuarioController = {
  overview: async (_req: Request, res: Response) => {
    const data = await CajaUsuarioService.overview();
    res.json(data);
  },

  create: async (req: Request, res: Response) => {
    const cajaCodigo = req.body?.cajaCodigo;
    const usuarioCodigo = req.body?.usuarioCodigo;

    if (cajaCodigo === null || usuarioCodigo === null) {
      res.status(400).json({ message: 'Codigo de caja y usuario son obligatorios' });
      return;
    }

    const asignaciones = await CajaUsuarioService.create(cajaCodigo, usuarioCodigo);
    res.status(201).json({ asignaciones });
  },

  remove: async (req: Request, res: Response) => {
    const cajaCodigo = parseCodigo(req.params.cajaCodigo);
    const usuarioCodigo = parseCodigo(req.params.usuarioCodigo);

    if (cajaCodigo === null || usuarioCodigo === null) {
      res.status(400).json({ message: 'Codigos invalidos' });
      return;
    }

    const removed = await CajaUsuarioService.remove(cajaCodigo, usuarioCodigo);

    if (!removed) {
      res.status(404).json({ message: 'Asignacion no encontrada' });
      return;
    }

    res.status(204).send();
  },
};

export default CajaUsuarioController;

