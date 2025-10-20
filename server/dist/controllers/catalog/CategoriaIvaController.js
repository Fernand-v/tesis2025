"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CategoriaIvaService_1 = __importDefault(require("../../services/catalog/CategoriaIvaService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const CategoriaIvaController = {
    list: async (_req, res) => {
        const categorias = await CategoriaIvaService_1.default.list();
        res.json({ categorias });
    },
    create: async (req, res) => {
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        const tasaValue = typeof req.body?.tasa === 'number' ? req.body.tasa : Number(req.body?.tasa ?? NaN);
        if (!descripcion) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        if (!Number.isFinite(tasaValue) || tasaValue < 0) {
            res.status(400).json({ message: 'La tasa debe ser un numero positivo' });
            return;
        }
        try {
            const categoria = await CategoriaIvaService_1.default.create(descripcion, Number(tasaValue));
            res.status(201).json(categoria);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        const tasaValue = typeof req.body?.tasa === 'number' ? req.body.tasa : Number(req.body?.tasa ?? NaN);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        if (!descripcion) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        if (!Number.isFinite(tasaValue) || tasaValue < 0) {
            res.status(400).json({ message: 'La tasa debe ser un numero positivo' });
            return;
        }
        const categoria = await CategoriaIvaService_1.default.update(codigo, descripcion, Number(tasaValue));
        if (!categoria) {
            res.status(404).json({ message: 'Categoria no encontrada' });
            return;
        }
        res.json(categoria);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await CategoriaIvaService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Categoria no encontrada' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = CategoriaIvaController;
//# sourceMappingURL=CategoriaIvaController.js.map