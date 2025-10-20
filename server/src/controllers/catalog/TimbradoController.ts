import type { Request, Response } from 'express';

import TimbradoService from '../../services/catalog/TimbradoService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const validatePayload = (body: Record<string, unknown>) => {
  const {
    numero,
    fechaInicio,
    fechaFin,
    digitoDesde,
    digitoHasta,
    activo,
    autorizacion,
    puntoExpedicion,
    establecimiento,
  } = body;

  if (
    typeof numero !== 'string' ||
    typeof fechaInicio !== 'string' ||
    typeof fechaFin !== 'string' ||
    typeof digitoDesde !== 'string' ||
    typeof digitoHasta !== 'string' ||
    typeof activo !== 'string' ||
    typeof autorizacion !== 'string' ||
    typeof puntoExpedicion !== 'number' ||
    Number.isNaN(puntoExpedicion) ||
    typeof establecimiento !== 'number' ||
    Number.isNaN(establecimiento)
  ) {
    return null;
  }

  const numeroValue = numero.trim();
  const desdeValue = digitoDesde.trim();
  const hastaValue = digitoHasta.trim();
  const activoValue = activo.trim().toUpperCase();
  const autorizacionValue = autorizacion.trim();

  if (
    !numeroValue ||
    !fechaInicio ||
    !fechaFin ||
    !desdeValue ||
    !hastaValue ||
    !autorizacionValue ||
    (activoValue !== 'S' && activoValue !== 'N')
  ) {
    return null;
  }

  return {
    numero: numeroValue,
    fechaInicio,
    fechaFin,
    digitoDesde: desdeValue,
    digitoHasta: hastaValue,
    activo: activoValue,
    autorizacion: autorizacionValue,
    puntoExpedicion,
    establecimiento,
  };
};

const TimbradoController = {
  list: async (_req: Request, res: Response) => {
    const timbrados = await TimbradoService.list();
    res.json({ timbrados });
  },

  create: async (req: Request, res: Response) => {
    const payload = validatePayload(req.body as Record<string, unknown>);

    if (!payload) {
      res.status(400).json({ message: 'Datos incompletos' });
      return;
    }

    try {
      const timbrado = await TimbradoService.create(payload);
      res.status(201).json(timbrado);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  },

  update: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);
    const payload = validatePayload(req.body as Record<string, unknown>);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    if (!payload) {
      res.status(400).json({ message: 'Datos incompletos' });
      return;
    }

    const timbrado = await TimbradoService.update(codigo, payload);

    if (!timbrado) {
      res.status(404).json({ message: 'Timbrado no encontrado' });
      return;
    }

    res.json(timbrado);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await TimbradoService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Timbrado no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default TimbradoController;
