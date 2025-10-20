"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EstadoService_1 = __importDefault(require("../../services/catalog/EstadoService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const EstadoController = {
    list: async (_req, res) => {
        const estados = await EstadoService_1.default.list();
        res.json({ estados });
    },
    create: async (req, res) => {
        const { descripcion } = req.body;
        const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';
        if (!descripcionValue) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        try {
            const estado = await EstadoService_1.default.create(descripcionValue);
            res.status(201).json(estado);
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
        const estado = await EstadoService_1.default.update(codigo, descripcionValue);
        if (!estado) {
            res.status(404).json({ message: 'Estado no encontrado' });
            return;
        }
        res.json(estado);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await EstadoService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Estado no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = EstadoController;
//# sourceMappingURL=EstadoController.js.map