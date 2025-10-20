"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = __importDefault(require("../../database/pool"));
const GrupoService_1 = __importDefault(require("./GrupoService"));
const MarcaService_1 = __importDefault(require("./MarcaService"));
/**
 * Normaliza los resultados de MySQL cuando se usan procedimientos almacenados.
 */
const normalizeResultSets = (rows) => {
    if (!Array.isArray(rows))
        return [];
    return rows.filter((set) => Array.isArray(set));
};
/**
 * Extrae cantidad de filas afectadas de un conjunto de resultados.
 */
const extractAffected = (rows) => {
    const sets = normalizeResultSets(rows);
    if (!sets[0] || sets[0].length === 0)
        return 0;
    const record = sets[0][0];
    return Number(record.affected ?? 0);
};
/**
 * Encuentra el primer conjunto de resultados no vacío.
 */
const findFirstSet = (rows) => {
    const sets = normalizeResultSets(rows);
    for (const set of sets) {
        if (set.length > 0)
            return set;
    }
    return [];
};
/**
 * Mapeo de filas SQL a objetos Item.
 */
const mapItem = (row) => ({
    codigo: Number(row.ITEM_CODIGO),
    descripcion: String(row.ITEM_DESC),
    codigoBarra: row.ITEM_COD_BARRA === null ? null : String(row.ITEM_COD_BARRA),
    activo: String(row.ITEM_ACTIVO),
    afectaStock: String(row.ITEM_AFECTA_STOCK),
    marcaCodigo: Number(row.ITEM_MARCA),
    marcaDescripcion: String(row.MAR_DESC),
    grupoCodigo: Number(row.ITEM_GRUPO),
    grupoDescripcion: String(row.GRU_DESC),
    categoriaCodigo: Number(row.ITEM_CAT_IVA),
    categoriaDescripcion: String(row.CAT_DESC),
    categoriaTasa: Number(row.CAT_IVA),
    porcGanancia: Number(row.ITEM_PORC_GANANCIA ?? 0),
    indDescuento: String(row.ITEM_IND_DESCUENTO ?? 'N'),
});
/**
 * Mapeo de filas SQL a categorías de IVA.
 */
const mapCategoria = (row) => ({
    codigo: Number(row.CAT_CODIGO),
    descripcion: String(row.CAT_DESC),
    tasa: Number(row.CAT_IVA),
});
class ItemService {
    // === LISTAR ITEMS ===
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_item_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapItem);
    }
    // === OBTENER ITEM POR CÓDIGO ===
    static async get(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_item_get(?)', [codigo]);
        const resultRows = findFirstSet(rows);
        const first = resultRows[0];
        return first ? mapItem(first) : null;
    }
    // === CREAR ITEM ===
    static async create(data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_item_create(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            data.descripcion,
            data.codigoBarra,
            data.activo,
            data.afectaStock,
            data.marcaCodigo,
            data.grupoCodigo,
            data.categoriaCodigo,
            data.porcGanancia,
            data.indDescuento,
        ]);
        const resultRows = findFirstSet(rows);
        const first = resultRows[0];
        if (!first)
            throw new Error('No se pudo crear el item');
        return mapItem(first);
    }
    // === ACTUALIZAR ITEM ===
    static async update(codigo, data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_item_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            codigo,
            data.descripcion,
            data.codigoBarra,
            data.activo,
            data.afectaStock,
            data.marcaCodigo,
            data.grupoCodigo,
            data.categoriaCodigo,
            data.porcGanancia,
            data.indDescuento,
        ]);
        const resultRows = findFirstSet(rows);
        const first = resultRows[0];
        return first ? mapItem(first) : null;
    }
    // === ELIMINAR ITEM ===
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_item_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
    // === LISTAR CATEGORÍAS IVA ===
    static async listCategorias() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_categoria_iva_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapCategoria);
    }
    // === OVERVIEW (para front) ===
    static async overview() {
        const [items, grupos, marcas, categorias] = await Promise.all([
            this.list(),
            GrupoService_1.default.list(),
            MarcaService_1.default.list(),
            this.listCategorias(),
        ]);
        return { items, grupos, marcas, categorias };
    }
}
exports.default = ItemService;
//# sourceMappingURL=ItemService.js.map