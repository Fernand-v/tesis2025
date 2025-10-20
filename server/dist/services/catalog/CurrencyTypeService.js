"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = __importDefault(require("../../database/pool"));
const normalizeResultSets = (rows) => {
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.filter((set) => Array.isArray(set));
};
const mapCurrency = (row) => ({
    codigo: Number(row.TMON_CODIGO),
    denominacion: String(row.TMON_DENOMINACION),
    tasa: Number(row.TMON_TASA),
    simbolo: String(row.TMON_SIMBOLO),
});
const extractAffected = (rows) => {
    const resultSets = normalizeResultSets(rows);
    if (!resultSets[0] || resultSets[0].length === 0) {
        return 0;
    }
    const record = resultSets[0][0];
    return Number(record.affected ?? 0);
};
class CurrencyTypeService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapCurrency);
    }
    static async get(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_get(?)', [codigo]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            return null;
        }
        return mapCurrency(resultRow);
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_create(?, ?, ?)', [
            data.denominacion,
            data.tasa,
            data.simbolo,
        ]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            throw new Error('No se pudo crear el tipo de moneda');
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            throw new Error('No se pudo crear el tipo de moneda');
        }
        return mapCurrency(resultRow);
    }
    static async update(codigo, data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_update(?, ?, ?, ?)', [
            codigo,
            data.denominacion,
            data.tasa,
            data.simbolo,
        ]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            return null;
        }
        return mapCurrency(resultRow);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = CurrencyTypeService;
//# sourceMappingURL=CurrencyTypeService.js.map