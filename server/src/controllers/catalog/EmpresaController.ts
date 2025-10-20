import type { Request, Response } from 'express';

import EmpresaService from '../../services/catalog/EmpresaService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const sanitize = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const EmpresaController = {
  list: async (_req: Request, res: Response) => {
    const empresas = await EmpresaService.list();
    res.json({ empresas });
  },

  create: async (req: Request, res: Response) => {
    const razonSocial = sanitize(req.body?.razonSocial);
    const ruc = sanitize(req.body?.ruc);
    const telefono = sanitize(req.body?.telefono);
    const celular = sanitize(req.body?.celular);
    const direccion = sanitize(req.body?.direccion);
    const logo = sanitize(req.body?.logo);

    if (!razonSocial || !ruc || !celular || !direccion) {
      res.status(400).json({ message: 'Razon social, RUC, celular y direccion son obligatorios' });
      return;
    }

    try {
      const empresa = await EmpresaService.create({
        razonSocial,
        ruc,
        telefono: toNullable(telefono),
        celular,
        direccion,
        logo: toNullable(logo),
      });
      res.status(201).json(empresa);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  },

  update: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const razonSocial = sanitize(req.body?.razonSocial);
    const ruc = sanitize(req.body?.ruc);
    const telefono = sanitize(req.body?.telefono);
    const celular = sanitize(req.body?.celular);
    const direccion = sanitize(req.body?.direccion);
    const logo = sanitize(req.body?.logo);

    if (!razonSocial || !ruc || !celular || !direccion) {
      res.status(400).json({ message: 'Razon social, RUC, celular y direccion son obligatorios' });
      return;
    }

    const empresa = await EmpresaService.update(codigo, {
      razonSocial,
      ruc,
      telefono: toNullable(telefono),
      celular,
      direccion,
      logo: toNullable(logo),
    });

    if (!empresa) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    res.json(empresa);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await EmpresaService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    res.status(204).send();
  },
};

export default EmpresaController;

