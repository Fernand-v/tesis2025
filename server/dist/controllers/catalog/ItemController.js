"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GrupoService_1 = __importDefault(require("../../services/catalog/GrupoService"));
const ItemService_1 = __importDefault(require("../../services/catalog/ItemService"));
const MarcaService_1 = __importDefault(require("../../services/catalog/MarcaService"));
const parseCodigo = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
const validateFlags = (value) => value === 'S' || value === 'N';
const ItemController = {
    list: async (_req, res) => {
        const [items, grupos, marcas, categorias] = await Promise.all([
            ItemService_1.default.list(),
            GrupoService_1.default.list(),
            MarcaService_1.default.list(),
            ItemService_1.default.listCategorias(),
        ]);
        res.json({
            items,
            grupos,
            marcas,
            categorias,
        });
    },
    create: async (req, res) => {
        const descripcion = sanitize(req.body?.descripcion);
        const codigoBarra = sanitize(req.body?.codigoBarra);
        const activo = sanitize(req.body?.activo || 'S').toUpperCase();
        const afectaStock = sanitize(req.body?.afectaStock || 'S').toUpperCase();
        const marcaCodigo = Number(req.body?.marcaCodigo ?? NaN);
        const grupoCodigo = Number(req.body?.grupoCodigo ?? NaN);
        const categoriaCodigo = Number(req.body?.categoriaCodigo ?? NaN);
        const porcGanancia = Number(req.body?.porcGanancia ?? 0);
        const indDescuento = sanitize(req.body?.indDescuento || 'N').toUpperCase();
        // === VALIDACIONES ===
        if (!descripcion) {
            res.status(400).json({ message: 'La descripción es obligatoria' });
            return;
        }
        if (!validateFlags(activo)) {
            res.status(400).json({ message: 'El indicador de activo debe ser S o N' });
            return;
        }
        if (!validateFlags(afectaStock)) {
            res.status(400).json({ message: 'El indicador de stock debe ser S o N' });
            return;
        }
        if (!validateFlags(indDescuento)) {
            res.status(400).json({ message: 'El indicador de descuento debe ser S o N' });
            return;
        }
        if (!Number.isFinite(marcaCodigo) || !Number.isFinite(grupoCodigo) || !Number.isFinite(categoriaCodigo)) {
            res.status(400).json({ message: 'Selecciona marca, grupo y categoría IVA' });
            return;
        }
        if (Number.isNaN(porcGanancia) || porcGanancia < 0) {
            res.status(400).json({ message: 'El porcentaje de ganancia debe ser un número positivo' });
            return;
        }
        try {
            const item = await ItemService_1.default.create({
                descripcion,
                codigoBarra: codigoBarra || null,
                activo,
                afectaStock,
                marcaCodigo,
                grupoCodigo,
                categoriaCodigo,
                porcGanancia,
                indDescuento,
            });
            res.status(201).json(item);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Código inválido' });
            return;
        }
        const descripcion = sanitize(req.body?.descripcion);
        const codigoBarra = sanitize(req.body?.codigoBarra);
        const activo = sanitize(req.body?.activo || 'S').toUpperCase();
        const afectaStock = sanitize(req.body?.afectaStock || 'S').toUpperCase();
        const marcaCodigo = Number(req.body?.marcaCodigo ?? NaN);
        const grupoCodigo = Number(req.body?.grupoCodigo ?? NaN);
        const categoriaCodigo = Number(req.body?.categoriaCodigo ?? NaN);
        const porcGanancia = Number(req.body?.porcGanancia ?? 0);
        const indDescuento = sanitize(req.body?.indDescuento || 'N').toUpperCase();
        // === VALIDACIONES ===
        if (!descripcion) {
            res.status(400).json({ message: 'La descripción es obligatoria' });
            return;
        }
        if (!validateFlags(activo) || !validateFlags(afectaStock) || !validateFlags(indDescuento)) {
            res.status(400).json({ message: 'Los indicadores deben ser S o N' });
            return;
        }
        if (!Number.isFinite(marcaCodigo) || !Number.isFinite(grupoCodigo) || !Number.isFinite(categoriaCodigo)) {
            res.status(400).json({ message: 'Selecciona marca, grupo y categoría IVA' });
            return;
        }
        if (Number.isNaN(porcGanancia) || porcGanancia < 0) {
            res.status(400).json({ message: 'El porcentaje de ganancia debe ser un número positivo' });
            return;
        }
        try {
            const item = await ItemService_1.default.update(codigo, {
                descripcion,
                codigoBarra: codigoBarra || null,
                activo,
                afectaStock,
                marcaCodigo,
                grupoCodigo,
                categoriaCodigo,
                porcGanancia,
                indDescuento,
            });
            if (!item) {
                res.status(404).json({ message: 'Item no encontrado' });
                return;
            }
            res.json(item);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    remove: async (req, res) => {
        const codigo = parseCodigo(req.params.codigo);
        if (codigo === null) {
            res.status(400).json({ message: 'Código inválido' });
            return;
        }
        const removed = await ItemService_1.default.remove(codigo);
        if (!removed) {
            res.status(404).json({ message: 'Item no encontrado' });
            return;
        }
        res.status(204).send();
    },
};
exports.default = ItemController;
//# sourceMappingURL=ItemController.js.map