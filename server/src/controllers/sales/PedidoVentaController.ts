import type { Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth';
import PedidoVentaService, {
  CajaAperturaRequiredError,
  PedidoSearchFilters,
} from '../../services/sales/PedidoVentaService';
import { logRequestEvent } from '../../utils/logger';

const sanitizeDetalleInput = (
  value: unknown,
): { itemCodigo: number; cantidad: number; precio: number } | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as { itemCodigo?: unknown; cantidad?: unknown; precio?: unknown };
  const itemCodigo = Number(candidate.itemCodigo);
  const cantidad = Number(candidate.cantidad);
  const precio = Number(candidate.precio);

  if (!Number.isFinite(itemCodigo) || itemCodigo <= 0) {
    return null;
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return null;
  }

  if (!Number.isFinite(precio) || precio < 0) {
    return null;
  }

  return { itemCodigo, cantidad, precio };
};

const PedidoVentaController = {
  list: async (req: AuthenticatedRequest, res: Response) => {
    const personaCodigoRaw = req.query.personaCodigo;
    const estadoRaw = req.query.estado;
    const fechaDesdeRaw = req.query.fechaDesde;
    const fechaHastaRaw = req.query.fechaHasta;
    const texto = typeof req.query.q === 'string' ? req.query.q : null;

    const filters: PedidoSearchFilters = {
      personaCodigo:
        typeof personaCodigoRaw === 'string' && personaCodigoRaw !== ''
          ? Number(personaCodigoRaw)
          : null,
      estadoCodigo:
        typeof estadoRaw === 'string' && estadoRaw !== '' ? Number(estadoRaw) : null,
      fechaDesde: typeof fechaDesdeRaw === 'string' ? fechaDesdeRaw : null,
      fechaHasta: typeof fechaHastaRaw === 'string' ? fechaHastaRaw : null,
      texto,
    };

    if (filters.personaCodigo !== null && Number.isNaN(filters.personaCodigo)) {
      res.status(400).json({ message: 'Parametro personaCodigo invalido' });
      return;
    }

    if (filters.estadoCodigo !== null && Number.isNaN(filters.estadoCodigo)) {
      res.status(400).json({ message: 'Parametro estado invalido' });
      return;
    }

    const pedidos = await PedidoVentaService.search(filters);
    res.json({ pedidos });
  },

  get: async (req: AuthenticatedRequest, res: Response) => {
    const codigo = Number(req.params.codigo ?? NaN);

    if (!Number.isFinite(codigo) || codigo <= 0) {
      res.status(400).json({ message: 'Codigo invalido' });
      return;
    }

    const pedido = await PedidoVentaService.get(codigo);

    if (!pedido) {
      res.status(404).json({ message: 'Pedido no encontrado' });
      return;
    }

    res.json(pedido);
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth || typeof req.auth.sub === 'undefined') {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const usuarioCodigo = Number(req.auth.sub);
    if (Number.isNaN(usuarioCodigo)) {
      res.status(400).json({ message: 'Token invalido' });
      return;
    }

    const fechaPedido = typeof req.body?.fechaPedido === 'string' ? req.body.fechaPedido : '';
    const fechaEntrega =
      typeof req.body?.fechaEntrega === 'string' && req.body.fechaEntrega.trim() !== ''
        ? req.body.fechaEntrega
        : null;
    const personaCodigo = Number(req.body?.personaCodigo ?? NaN);
    const observacion =
      typeof req.body?.observacion === 'string' && req.body.observacion.trim() !== ''
        ? req.body.observacion.trim()
        : null;
    const adelanto = Number(req.body?.adelanto ?? 0);
    const detallesRaw = Array.isArray(req.body?.items) ? (req.body.items as unknown[]) : [];
    type DetalleParsed = { itemCodigo: number; cantidad: number; precio: number };
    const detallesParsed: Array<DetalleParsed | null> = detallesRaw.map(sanitizeDetalleInput);
    const detalles = detallesParsed.filter((detalle): detalle is DetalleParsed => detalle !== null);

    if (!fechaPedido) {
      res.status(400).json({ message: 'La fecha del pedido es obligatoria' });
      return;
    }

    if (!Number.isFinite(personaCodigo) || personaCodigo <= 0) {
      res.status(400).json({ message: 'Selecciona una persona valida' });
      return;
    }

    if (detalles.length === 0) {
      res.status(400).json({ message: 'Agrega al menos un item al pedido' });
      return;
    }

    if (!Number.isFinite(adelanto) || adelanto < 0) {
      res.status(400).json({ message: 'El adelanto es invalido' });
      return;
    }

    try {
      const pedido = await PedidoVentaService.create(
        {
          fechaPedido,
          fechaEntrega,
          observacion,
          personaCodigo,
          adelanto,
          items: detalles,
        },
        usuarioCodigo,
      );

      res.status(201).json(pedido);
    } catch (error) {
      if (error instanceof CajaAperturaRequiredError) {
        void logRequestEvent(req, {
          section: 'PEDIDO',
          statusCode: 409,
          message: error.message,
          priority: 2,
        });
        res.status(409).json({ message: error.message });
        return;
      }

      void logRequestEvent(req, {
        section: 'PEDIDO',
        statusCode: 400,
        message: 'No se pudo registrar el pedido',
        detail: (error as Error).message,
        priority: 2,
      });
      res.status(400).json({ message: (error as Error).message });
    }
  },
};

export default PedidoVentaController;
