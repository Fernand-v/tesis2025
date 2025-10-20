"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CajaUsuarioService_1 = __importDefault(require("../../services/catalog/CajaUsuarioService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const CajaUsuarioController = {
    overview: async (_req, res) => {
        const data = await CajaUsuarioService_1.default.overview();
        res.json(data);
    },
    create: async (req, res) => {
        const cajaCodigo = req.body?.cajaCodigo;
        const usuarioCodigo = req.body?.usuarioCodigo;
        if (cajaCodigo === null || usuarioCodigo === null) {
            res.status(400).json({ message: 'Codigo de caja y usuario son obligatorios' });
            return;
        }
        const asignaciones = await CajaUsuarioService_1.default.create(cajaCodigo, usuarioCodigo);
        res.status(201).json({ asignaciones });
    },
    remove: async (req, res) => {
        const cajaCodigo = parseCodigo(req.params.cajaCodigo);
        const usuarioCodigo = parseCodigo(req.params.usuarioCodigo);
        if (cajaCodigo === null || usuarioCodigo === null) {
            res.status(400).json({ message: 'Codigos invalidos' });
            return;
        }
        const removed = await CajaUsuarioService_1.default.remove(cajaCodigo, usuarioCodigo);
        if (!removed) {
            res.status(404).json({ message: 'Asignacion no encontrada' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = CajaUsuarioController;
//# sourceMappingURL=CajaUsuarioController.js.map