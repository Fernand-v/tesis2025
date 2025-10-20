"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DispositivoService_1 = __importDefault(require("../../services/catalog/DispositivoService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const parseNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
};
const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
const validatePayload = (data) => {
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
    list: async (_req, res) => {
        const [dispositivos, lookups] = await Promise.all([
            DispositivoService_1.default.list(),
            DispositivoService_1.default.lookups(),
        ]);
        res.json({
            dispositivos,
            modelos: lookups.modelos,
            marcas: lookups.marcas,
        });
    },
    create: async (req, res) => {
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
            const dispositivo = await DispositivoService_1.default.create({
                descripcion,
                modeloCodigo: Number(modeloCodigo),
                marcaCodigo: Number(marcaCodigo),
                ram: Number(ram),
                rom: Number(rom),
            });
            res.status(201).json(dispositivo);
        }
        catch (err) {
            res.status(400).json({ message: err.message });
        }
    },
    update: async (req, res) => {
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
        const dispositivo = await DispositivoService_1.default.update(codigo, {
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
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await DispositivoService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Dispositivo no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = DispositivoController;
//# sourceMappingURL=DispositivoController.js.map