"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CajaService_1 = __importDefault(require("../../services/catalog/CajaService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const CajaController = {
    list: async (_req, res) => {
        const cajas = await CajaService_1.default.list();
        res.json({ cajas });
    },
    create: async (req, res) => {
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        if (!descripcion) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        try {
            const caja = await CajaService_1.default.create(descripcion);
            res.status(201).json(caja);
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
        const caja = await CajaService_1.default.update(codigo, descripcion);
        if (!caja) {
            res.status(404).json({ message: 'Caja no encontrada' });
            return;
        }
        res.json(caja);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await CajaService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Caja no encontrada' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = CajaController;
//# sourceMappingURL=CajaController.js.map