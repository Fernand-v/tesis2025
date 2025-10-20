"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FallaService_1 = __importDefault(require("../../services/catalog/FallaService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const FallaController = {
    list: async (_req, res) => {
        const fallas = await FallaService_1.default.list();
        res.json({ fallas });
    },
    create: async (req, res) => {
        const { descripcion } = req.body;
        const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';
        if (!descripcionValue) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        try {
            const falla = await FallaService_1.default.create(descripcionValue);
            res.status(201).json(falla);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const { descripcion } = req.body;
        const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        if (!descripcionValue) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        const falla = await FallaService_1.default.update(codigo, descripcionValue);
        if (!falla) {
            res.status(404).json({ message: 'Falla no encontrada' });
            return;
        }
        res.json(falla);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await FallaService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Falla no encontrada' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = FallaController;
//# sourceMappingURL=FallaController.js.map