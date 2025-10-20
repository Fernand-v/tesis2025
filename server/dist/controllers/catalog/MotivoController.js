"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MotivoService_1 = __importDefault(require("../../services/catalog/MotivoService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const MotivoController = {
    list: async (_req, res) => {
        const motivos = await MotivoService_1.default.list();
        res.json({ motivos });
    },
    create: async (req, res) => {
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        if (!descripcion) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        try {
            const motivo = await MotivoService_1.default.create(descripcion);
            res.status(201).json(motivo);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        if (!descripcion) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        const motivo = await MotivoService_1.default.update(codigo, descripcion);
        if (!motivo) {
            res.status(404).json({ message: 'Motivo no encontrado' });
            return;
        }
        res.json(motivo);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await MotivoService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Motivo no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = MotivoController;
//# sourceMappingURL=MotivoController.js.map