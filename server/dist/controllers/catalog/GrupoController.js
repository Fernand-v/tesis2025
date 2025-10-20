"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GrupoService_1 = __importDefault(require("../../services/catalog/GrupoService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const GrupoController = {
    list: async (_req, res) => {
        const grupos = await GrupoService_1.default.list();
        res.json({ grupos });
    },
    create: async (req, res) => {
        const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
        if (!descripcion) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        try {
            const grupo = await GrupoService_1.default.create(descripcion);
            res.status(201).json(grupo);
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
        const grupo = await GrupoService_1.default.update(codigo, descripcion);
        if (!grupo) {
            res.status(404).json({ message: 'Grupo no encontrado' });
            return;
        }
        res.json(grupo);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await GrupoService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Grupo no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = GrupoController;
//# sourceMappingURL=GrupoController.js.map