"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TimbradoService_1 = __importDefault(require("../../services/catalog/TimbradoService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const validatePayload = (body) => {
    const { numero, fechaInicio, fechaFin, digitoDesde, digitoHasta, activo, autorizacion, puntoExpedicion, establecimiento, } = body;
    if (typeof numero !== 'string' ||
        typeof fechaInicio !== 'string' ||
        typeof fechaFin !== 'string' ||
        typeof digitoDesde !== 'string' ||
        typeof digitoHasta !== 'string' ||
        typeof activo !== 'string' ||
        typeof autorizacion !== 'string' ||
        typeof puntoExpedicion !== 'number' ||
        Number.isNaN(puntoExpedicion) ||
        typeof establecimiento !== 'number' ||
        Number.isNaN(establecimiento)) {
        return null;
    }
    const numeroValue = numero.trim();
    const desdeValue = digitoDesde.trim();
    const hastaValue = digitoHasta.trim();
    const activoValue = activo.trim().toUpperCase();
    const autorizacionValue = autorizacion.trim();
    if (!numeroValue ||
        !fechaInicio ||
        !fechaFin ||
        !desdeValue ||
        !hastaValue ||
        !autorizacionValue ||
        (activoValue !== 'S' && activoValue !== 'N')) {
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
    list: async (_req, res) => {
        const timbrados = await TimbradoService_1.default.list();
        res.json({ timbrados });
    },
    create: async (req, res) => {
        const payload = validatePayload(req.body);
        if (!payload) {
            res.status(400).json({ message: 'Datos incompletos' });
            return;
        }
        try {
            const timbrado = await TimbradoService_1.default.create(payload);
            res.status(201).json(timbrado);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const payload = validatePayload(req.body);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        if (!payload) {
            res.status(400).json({ message: 'Datos incompletos' });
            return;
        }
        const timbrado = await TimbradoService_1.default.update(codigo, payload);
        if (!timbrado) {
            res.status(404).json({ message: 'Timbrado no encontrado' });
            return;
        }
        res.json(timbrado);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await TimbradoService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Timbrado no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = TimbradoController;
//# sourceMappingURL=TimbradoController.js.map