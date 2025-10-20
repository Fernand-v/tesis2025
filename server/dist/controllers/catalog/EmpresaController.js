"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmpresaService_1 = __importDefault(require("../../services/catalog/EmpresaService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
const toNullable = (value) => {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
};
const EmpresaController = {
    list: async (_req, res) => {
        const empresas = await EmpresaService_1.default.list();
        res.json({ empresas });
    },
    create: async (req, res) => {
        const razonSocial = sanitize(req.body?.razonSocial);
        const ruc = sanitize(req.body?.ruc);
        const telefono = sanitize(req.body?.telefono);
        const celular = sanitize(req.body?.celular);
        const direccion = sanitize(req.body?.direccion);
        const logo = sanitize(req.body?.logo);
        if (!razonSocial || !ruc || !celular || !direccion) {
            res.status(400).json({ message: 'Razon social, RUC, celular y direccion son obligatorios' });
            return;
        }
        try {
            const empresa = await EmpresaService_1.default.create({
                razonSocial,
                ruc,
                telefono: toNullable(telefono),
                celular,
                direccion,
                logo: toNullable(logo),
            });
            res.status(201).json(empresa);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const razonSocial = sanitize(req.body?.razonSocial);
        const ruc = sanitize(req.body?.ruc);
        const telefono = sanitize(req.body?.telefono);
        const celular = sanitize(req.body?.celular);
        const direccion = sanitize(req.body?.direccion);
        const logo = sanitize(req.body?.logo);
        if (!razonSocial || !ruc || !celular || !direccion) {
            res.status(400).json({ message: 'Razon social, RUC, celular y direccion son obligatorios' });
            return;
        }
        const empresa = await EmpresaService_1.default.update(codigo, {
            razonSocial,
            ruc,
            telefono: toNullable(telefono),
            celular,
            direccion,
            logo: toNullable(logo),
        });
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json(empresa);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await EmpresaService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = EmpresaController;
//# sourceMappingURL=EmpresaController.js.map