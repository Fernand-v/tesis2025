"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PaymentMethodService_1 = __importDefault(require("../../services/catalog/PaymentMethodService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const PaymentMethodController = {
    list: async (_req, res) => {
        const formas = await PaymentMethodService_1.default.list();
        res.json({ formas });
    },
    create: async (req, res) => {
        const { descripcion } = req.body;
        const descripcionValue = typeof descripcion === 'string' ? descripcion.trim() : '';
        if (!descripcionValue) {
            res.status(400).json({ message: 'La descripcion es obligatoria' });
            return;
        }
        try {
            const forma = await PaymentMethodService_1.default.create(descripcionValue);
            res.status(201).json(forma);
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
        const forma = await PaymentMethodService_1.default.update(codigo, descripcionValue);
        if (!forma) {
            res.status(404).json({ message: 'Forma de pago no encontrada' });
            return;
        }
        res.json(forma);
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Codigo invalido' });
            return;
        }
        const removed = await PaymentMethodService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Forma de pago no encontrada' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = PaymentMethodController;
//# sourceMappingURL=PaymentMethodController.js.map