import type { Request, Response } from 'express';

import RoleService from '../../services/catalog/RoleService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const RoleController = {
  list: async (_req: Request, res: Response) => {
    const roles = await RoleService.list();
    res.json({ roles });
  },

  detail: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const detail = await RoleService.getDetail(codigo);

    if (!detail) {
      res.status(404).json({ message: 'Rol no encontrado' });
      return;
    }

    res.json(detail);
  },

  create: async (req: Request, res: Response) => {
    const { descripcion } = req.body as { descripcion?: string };
    const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';

    if (!descripcionValue) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const role = await RoleService.create(descripcionValue);
      const detail = await RoleService.getDetail(role.codigo);

      res.status(201).json(detail ?? { role, assignedPrograms: [], availablePrograms: [] });
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

    const role = await RoleService.update(codigo, descripcionValue);

    if (!role) {
      res.status(404).json({ message: 'Rol no encontrado' });
      return;
    }

    const detail = await RoleService.getDetail(codigo);

    res.json(detail ?? { role, assignedPrograms: [], availablePrograms: [] });
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await RoleService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Rol no encontrado' });
      return;
    }

    res.status(204).send();
  },

  addProgram: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);
    const { programaCodigo } = req.body as { programaCodigo?: number };
    const programaId = typeof programaCodigo === 'number' ? programaCodigo : NaN;

    if (codigo === null || Number.isNaN(programaId)) {
      res.status(400).json({ message: 'Datos invalidos' });
      return;
    }

    const detail = await RoleService.addProgram(codigo, programaId);

    if (!detail) {
      res.status(404).json({ message: 'Rol no encontrado' });
      return;
    }

    res.json(detail);
  },

  removeProgram: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);
    const programaCodigo = parseCodigo(req.params.programaCodigo);

    if (codigo === null || programaCodigo === null) {
      res.status(400).json({ message: 'Datos invalidos' });
      return;
    }

    const detail = await RoleService.removeProgram(codigo, programaCodigo);

    if (!detail) {
      res.status(404).json({ message: 'Rol no encontrado' });
      return;
    }

    res.json(detail);
  },
};

export default RoleController;
