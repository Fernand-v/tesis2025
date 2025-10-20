"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CurrencyTypeService_1 = __importDefault(require("../../services/catalog/CurrencyTypeService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const CurrencyTypeController = {
    list: async (_req, res) => {
        const monedas = await CurrencyTypeService_1.default.list();
        res.json({ monedas });
    },
    create: async (req, res) => {
        const { denominacion, tasa, simbolo } = req.body;
        const denominacionValue = typeof denominacion === 'string' ? denominacion.trim() : '';
        const simboloValue = typeof simbolo === 'string' ? simbolo.trim() : '';
        if (!denominacionValue) {
            res.status(400).json({ message: 'La denominacion es obligatoria' });
            return;
        }
        if (typeof tasa !== 'number' || Number.isNaN(tasa)) {
            res.status(400).json({ message: 'La tasa debe ser numerica' });
            return;
        }
        if (!simboloValue) {
            res.status(400).json({ message: 'El simbolo es obligatorio' });
            return;
        }
        try {
            const moneda = await CurrencyTypeService_1.default.create({ denominacion: denominacionValue, tasa, simbolo: simboloValue });
            res.status(201).json(moneda);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        const { denominacion, tasa, simbolo } = req.body;
        const denominacionValue = typeof denominacion === 'string' ? denominacion.trim() : '';
        const simboloValue = typeof simbolo === 'string' ? simbolo.trim() : '';
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        if (!denominacionValue || typeof tasa !== 'number' || Number.isNaN(tasa) || !simboloValue) {
            res.status(400).json({ message: 'Datos incompletos' });
            return;
        }
        const moneda = await CurrencyTypeService_1.default.update(codigo, {
            denominacion: denominacionValue,
            tasa,
            simbolo: simboloValue,
        });
        if (!moneda) {
            res.status(404).json({ message: 'Tipo de moneda no encontrado' });
            return;
        }
        res.json(moneda);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await CurrencyTypeService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Tipo de moneda no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = CurrencyTypeController;
//# sourceMappingURL=CurrencyTypeController.js.map