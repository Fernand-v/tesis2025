"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ProgramService_1 = __importDefault(require("../../services/catalog/ProgramService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const normalizeBoolean = (value, defaultValue = 0) => {
    if (typeof value === 'number' && (value === 0 || value === 1)) {
        return value;
    }
    if (typeof value === 'string') {
        if (value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 's') {
            return 1;
        }
        if (value === '0' || value.toLowerCase() === 'false' || value.toLowerCase() === 'n') {
            return 0;
        }
    }
    return defaultValue;
};
const ProgramController = {
    list: async (_req, res) => {
        const overview = await ProgramService_1.default.overview();
        res.json(overview);
    },
    create: async (req, res) => {
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        const ubicacion = typeof req.body?.ubicacion === 'string' ? req.body.ubicacion.trim() : '';
        const formulario = typeof req.body?.formulario === 'string' ? req.body.formulario.trim() : '';
        const habilitado = normalizeBoolean(req.body?.habilitado, 0);
        const tipoCodigo = Number(req.body?.tipoCodigo ?? NaN);
        if (!descripcion || !ubicacion || !formulario) {
            res.status(400).json({ message: 'Descripcion, ubicacion y formulario son obligatorios' });
            return;
        }
        if (!Number.isFinite(tipoCodigo)) {
            res.status(400).json({ message: 'Selecciona un tipo de programa valido' });
            return;
        }
        try {
            const programa = await ProgramService_1.default.create({
                descripcion,
                ubicacion,
                formulario,
                habilitado,
                tipoCodigo: Number(tipoCodigo),
            });
            res.status(201).json(programa);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        const ubicacion = typeof req.body?.ubicacion === 'string' ? req.body.ubicacion.trim() : '';
        const formulario = typeof req.body?.formulario === 'string' ? req.body.formulario.trim() : '';
        const habilitado = normalizeBoolean(req.body?.habilitado, 0);
        const tipoCodigo = Number(req.body?.tipoCodigo ?? NaN);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        if (!descripcion || !ubicacion || !formulario) {
            res.status(400).json({ message: 'Descripcion, ubicacion y formulario son obligatorios' });
            return;
        }
        if (!Number.isFinite(tipoCodigo)) {
            res.status(400).json({ message: 'Selecciona un tipo de programa valido' });
            return;
        }
        const programa = await ProgramService_1.default.update(codigo, {
            descripcion,
            ubicacion,
            formulario,
            habilitado,
            tipoCodigo: Number(tipoCodigo),
        });
        if (!programa) {
            res.status(404).json({ message: 'Programa no encontrado' });
            return;
        }
        res.json(programa);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await ProgramService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Programa no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = ProgramController;
//# sourceMappingURL=ProgramController.js.map