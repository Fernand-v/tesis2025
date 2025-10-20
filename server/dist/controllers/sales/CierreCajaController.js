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
const CierreCajaService_1 = __importStar(require("../../services/sales/CierreCajaService"));
const ArqueoCajaService_1 = require("../../services/sales/ArqueoCajaService");
const PedidoVentaService_1 = require("../../services/sales/PedidoVentaService");
const logger_1 = require("../../utils/logger");
const parseDetalleInput = (value) => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const monedaCodigo = Number(value.monedaCodigo);
    const cantidad = Number(value.cantidad);
    if (!Number.isFinite(monedaCodigo) || monedaCodigo <= 0) {
        return null;
    }
    if (!Number.isFinite(cantidad) || cantidad < 0) {
        return null;
    }
    return { monedaCodigo, cantidad };
};
const CierreCajaController = {
    list: async (req, res) => {
        const mine = req.query.mine === 'true';
        let usuarioCodigo = null;
        if (mine) {
            if (!req.auth || typeof req.auth.sub === 'undefined') {
                res.status(401).json({ message: 'No autorizado' });
                return;
            }
            usuarioCodigo = Number(req.auth.sub);
            if (Number.isNaN(usuarioCodigo)) {
                res.status(400).json({ message: 'Token invalido' });
                return;
            }
        }
        const aperturaParam = req.query.apertura;
        let aperturaCodigo = null;
        if (typeof aperturaParam === 'string' && aperturaParam.trim() !== '') {
            const parsed = Number(aperturaParam);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                res.status(400).json({ message: 'Parametro apertura invalido' });
                return;
            }
            aperturaCodigo = parsed;
        }
        const cierres = await CierreCajaService_1.default.list({ usuarioCodigo, aperturaCodigo });
        res.json({ cierres });
    },
    available: async (req, res) => {
        if (!req.auth || typeof req.auth.sub === 'undefined') {
            res.status(401).json({ message: 'No autorizado' });
            return;
        }
        const usuarioCodigo = Number(req.auth.sub);
        if (Number.isNaN(usuarioCodigo)) {
            res.status(400).json({ message: 'Token invalido' });
            return;
        }
        const aperturaParam = req.query.apertura;
        let aperturaCodigo = null;
        if (typeof aperturaParam === 'string' && aperturaParam.trim() !== '') {
            const parsed = Number(aperturaParam);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                res.status(400).json({ message: 'Parametro apertura invalido' });
                return;
            }
            aperturaCodigo = parsed;
        }
        try {
            const resumen = await CierreCajaService_1.default.obtenerResumenDisponible(usuarioCodigo, aperturaCodigo);
            res.json(resumen);
        }
        catch (error) {
            if (error instanceof PedidoVentaService_1.CajaAperturaRequiredError) {
                res.status(409).json({ message: error.message });
                return;
            }
            if (error instanceof ArqueoCajaService_1.AperturaOwnerMismatchError) {
                res.status(403).json({ message: error.message });
                return;
            }
            if (error instanceof ArqueoCajaService_1.AperturaInactivaError) {
                res.status(409).json({ message: error.message });
                return;
            }
            res.status(400).json({ message: error.message });
        }
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
        const aperturaCodigo = typeof req.body?.aperturaCodigo === 'number' && Number.isFinite(req.body.aperturaCodigo)
            ? Number(req.body.aperturaCodigo)
            : null;
        const detallesRaw = Array.isArray(req.body?.detalles) ? req.body.detalles : [];
        const detalles = detallesRaw
            .map(parseDetalleInput)
            .filter((detalle) => detalle !== null);
        if (detalles.length === 0) {
            res.status(400).json({ message: 'Debes ingresar al menos una moneda con cantidad mayor o igual a cero' });
            return;
        }
        try {
            const cierre = await CierreCajaService_1.default.create({
                aperturaCodigo,
                usuarioCodigo,
                detalles,
            });
            res.status(201).json(cierre);
        }
        catch (error) {
            if (error instanceof PedidoVentaService_1.CajaAperturaRequiredError) {
                res.status(409).json({ message: error.message });
                return;
            }
            if (error instanceof ArqueoCajaService_1.AperturaOwnerMismatchError) {
                res.status(403).json({ message: error.message });
                return;
            }
            if (error instanceof ArqueoCajaService_1.AperturaInactivaError) {
                res.status(409).json({ message: error.message });
                return;
            }
            if (error instanceof CierreCajaService_1.CierreCajaAlreadyExistsError) {
                res.status(409).json({ message: error.message });
                return;
            }
            const message = error.message;
            if (message.includes('moneda') || message.includes('cantidad')) {
                res.status(400).json({ message });
                return;
            }
            void (0, logger_1.logRequestEvent)(req, {
                section: 'CIERRE',
                statusCode: 400,
                message: 'No se pudo registrar el cierre',
                detail: message,
                priority: 2,
            });
            res.status(400).json({ message });
        }
    },
};
exports.default = CierreCajaController;
//# sourceMappingURL=CierreCajaController.js.map