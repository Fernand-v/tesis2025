import type { Request, Response } from 'express';

import DispositivoService from '../../services/catalog/DispositivoService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const sanitize = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const validatePayload = (data: {
  descripcion: string;
  modeloCodigo: number | null;
  marcaCodigo: number | null;
  ram: number | null;
  rom: number | null;
}): string | null => {
  if (!data.descripcion) {
    return 'La descripcion es obligatoria';
  }
  if (data.modeloCodigo === null) {
    return 'Selecciona un modelo';
  }
  if (data.marcaCodigo === null) {
    return 'Selecciona una marca';
  }
  if (data.ram === null || data.ram <= 0) {
    return 'La memoria RAM debe ser mayor a cero';
  }
  if (data.rom === null || data.rom <= 0) {
    return 'La memoria ROM debe ser mayor a cero';
  }
  return null;
};

const DispositivoController = {
  list: async (_req: Request, res: Response) => {
    const [dispositivos, lookups] = await Promise.all([
      DispositivoService.list(),
      DispositivoService.lookups(),
    ]);

    res.json({
      dispositivos,
      modelos: lookups.modelos,
      marcas: lookups.marcas,
    });
  },

  create: async (req: Request, res: Response) => {
    const descripcion = sanitize(req.body?.descripcion);
    const modeloCodigo = parseNumber(req.body?.modeloCodigo);
    const marcaCodigo = parseNumber(req.body?.marcaCodigo);
    const ram = parseNumber(req.body?.ram);
    const rom = parseNumber(req.body?.rom);

    const error = validatePayload({ descripcion, modeloCodigo, marcaCodigo, ram, rom });

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    try {
      const dispositivo = await DispositivoService.create({
        descripcion,
        modeloCodigo: Number(modeloCodigo),
        marcaCodigo: Number(marcaCodigo),
        ram: Number(ram),
        rom: Number(rom),
      });
      res.status(201).json(dispositivo);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  },

  update: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const descripcion = sanitize(req.body?.descripcion);
    const modeloCodigo = parseNumber(req.body?.modeloCodigo);
    const marcaCodigo = parseNumber(req.body?.marcaCodigo);
    const ram = parseNumber(req.body?.ram);
    const rom = parseNumber(req.body?.rom);

    const error = validatePayload({ descripcion, modeloCodigo, marcaCodigo, ram, rom });

    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    const dispositivo = await DispositivoService.update(codigo, {
      descripcion,
      modeloCodigo: Number(modeloCodigo),
      marcaCodigo: Number(marcaCodigo),
      ram: Number(ram),
      rom: Number(rom),
    });

    if (!dispositivo) {
      res.status(404).json({ message: 'Dispositivo no encontrado' });
      return;
    }

    res.json(dispositivo);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await DispositivoService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Dispositivo no encontrado' });
      return;
    }

    res.status(204).send();
  },
};

export default DispositivoController;

