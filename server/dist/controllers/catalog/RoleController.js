"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RoleService_1 = __importDefault(require("../../services/catalog/RoleService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const RoleController = {
    list: async (_req, res) => {
        const roles = await RoleService_1.default.list();
        res.json({ roles });
    },
    detail: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const detail = await RoleService_1.default.getDetail(codigo);
        if (!detail) {
            res.status(404).json({ message: 'Rol no encontrado' });
            return;
        }
        res.json(detail);
    },
    create: async (req, res) => {
        const { descripcion } = req.body;
        const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';
        if (!descripcionValue) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        try {
            const role = await RoleService_1.default.create(descripcionValue);
            const detail = await RoleService_1.default.getDetail(role.codigo);
            res.status(201).json(detail ?? { role, assignedPrograms: [], availablePrograms: [] });
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
        const role = await RoleService_1.default.update(codigo, descripcionValue);
        if (!role) {
            res.status(404).json({ message: 'Rol no encontrado' });
            return;
        }
        const detail = await RoleService_1.default.getDetail(codigo);
        res.json(detail ?? { role, assignedPrograms: [], availablePrograms: [] });
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await RoleService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Rol no encontrado' });
            return;
        }
        res.status(204).send();
    },
    addProgram: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const { programaCodigo } = req.body;
        const programaId = typeof programaCodigo === 'number' ? programaCodigo : NaN;
        if (codigo === null || Number.isNaN(programaId)) {
            res.status(400).json({ message: 'Datos invalidos' });
            return;
        }
        const detail = await RoleService_1.default.addProgram(codigo, programaId);
        if (!detail) {
            res.status(404).json({ message: 'Rol no encontrado' });
            return;
        }
        res.json(detail);
    },
    removeProgram: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const programaCodigo = parseCodigo(req.params.programaCodigo);
        if (codigo === null || programaCodigo === null) {
            res.status(400).json({ message: 'Datos invalidos' });
            return;
        }
        const detail = await RoleService_1.default.removeProgram(codigo, programaCodigo);
        if (!detail) {
            res.status(404).json({ message: 'Rol no encontrado' });
            return;
        }
        res.json(detail);
    },
};
exports.default = RoleController;
//# sourceMappingURL=RoleController.js.map