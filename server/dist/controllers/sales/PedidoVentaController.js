"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const PedidoVentaService_1 = __importStar(require("../../services/sales/PedidoVentaService"));
const logger_1 = require("../../utils/logger");
const sanitizeDetalleInput = (value) => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const candidate = value;
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
    list: async (req, res) => {
        const personaCodigoRaw = req.query.personaCodigo;
        const estadoRaw = req.query.estado;
        const fechaDesdeRaw = req.query.fechaDesde;
        const fechaHastaRaw = req.query.fechaHasta;
        const texto = typeof req.query.q === 'string' ? req.query.q : null;
        const filters = {
            personaCodigo: typeof personaCodigoRaw === 'string' && personaCodigoRaw !== ''
                ? Number(personaCodigoRaw)
                : null,
            estadoCodigo: typeof estadoRaw === 'string' && estadoRaw !== '' ? Number(estadoRaw) : null,
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
        const pedidos = await PedidoVentaService_1.default.search(filters);
        res.json({ pedidos });
    },
    get: async (req, res) => {
        const codigo = Number(req.params.codigo ?? NaN);
        if (!Number.isFinite(codigo) || codigo <= 0) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const pedido = await PedidoVentaService_1.default.get(codigo);
        if (!pedido) {
            res.status(404).json({ message: 'Pedido no encontrado' });
            return;
        }
        res.json(pedido);
    },
    create: async (req, res) => {
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
        const fechaEntrega = typeof req.body?.fechaEntrega === 'string' && req.body.fechaEntrega.trim() !== ''
            ? req.body.fechaEntrega
            : null;
        const personaCodigo = Number(req.body?.personaCodigo ?? NaN);
        const observacion = typeof req.body?.observacion === 'string' && req.body.observacion.trim() !== ''
            ? req.body.observacion.trim()
            : null;
        const adelanto = Number(req.body?.adelanto ?? 0);
        const detallesRaw = Array.isArray(req.body?.items) ? req.body.items : [];
        const detallesParsed = detallesRaw.map(sanitizeDetalleInput);
        const detalles = detallesParsed.filter((detalle) => detalle !== null);
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
            const pedido = await PedidoVentaService_1.default.create({
                fechaPedido,
                fechaEntrega,
                observacion,
                personaCodigo,
                adelanto,
                items: detalles,
            }, usuarioCodigo);
            res.status(201).json(pedido);
        }
        catch (error) {
            if (error instanceof PedidoVentaService_1.CajaAperturaRequiredError) {
                void (0, logger_1.logRequestEvent)(req, {
                    section: 'PEDIDO',
                    statusCode: 409,
                    message: error.message,
                    priority: 2,
                });
                res.status(409).json({ message: error.message });
                return;
            }
            void (0, logger_1.logRequestEvent)(req, {
                section: 'PEDIDO',
                statusCode: 400,
                message: 'No se pudo registrar el pedido',
                detail: error.message,
                priority: 2,
            });
            res.status(400).json({ message: error.message });
        }
    },
};
exports.default = PedidoVentaController;
//# sourceMappingURL=PedidoVentaController.js.map