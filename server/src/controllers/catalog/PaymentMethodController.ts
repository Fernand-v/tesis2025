import type { Request, Response } from 'express';

import PaymentMethodService from '../../services/catalog/PaymentMethodService';

const parseCodigo = (value: string | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const PaymentMethodController = {
  list: async (_req: Request, res: Response) => {
    const formas = await PaymentMethodService.list();
    res.json({ formas });
  },

  create: async (req: Request, res: Response) => {
    const { descripcion } = req.body as { descripcion?: string };
    const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';

    if (!descripcionValue) {
      res.status(400).json({ message: 'La descripcion es obligatoria' });
      return;
    }

    try {
      const forma = await PaymentMethodService.create(descripcionValue);
      res.status(201).json(forma);
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

    const forma = await PaymentMethodService.update(codigo, descripcionValue);

    if (!forma) {
      res.status(404).json({ message: 'Forma de pago no encontrada' });
      return;
    }

    res.json(forma);
  },

  remove: async (req: Request, res: Response) => {
    const codigo = parseCodigo(req.params.codigo);

    if (codigo === null) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const removed = await PaymentMethodService.remove(codigo);

    if (!removed) {
      res.status(404).json({ message: 'Forma de pago no encontrada' });
      return;
    }

    res.status(204).send();
  },
};

export default PaymentMethodController;
