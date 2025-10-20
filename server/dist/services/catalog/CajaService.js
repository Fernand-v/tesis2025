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
const extractAffected = (rows) => {
    const sets = normalizeResultSets(rows);
    if (!sets[0] || sets[0].length === 0) {
        return 0;
    }
    const record = sets[0][0];
    return Number(record.affected ?? 0);
};
const mapCaja = (row) => ({
    codigo: Number(row.CAJ_CODIGO),
    descripcion: String(row.CAJ_DESC),
});
class CajaService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapCaja);
    }
    static async create(descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_create(?)', [descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            throw new Error('No se pudo crear la caja');
        }
        const first = resultRows[0];
        if (!first) {
            throw new Error('No se pudo recuperar la caja creada');
        }
        return mapCaja(first);
    }
    static async update(codigo, descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_update(?, ?)', [codigo, descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const first = resultRows[0];
        if (!first) {
            return null;
        }
        return mapCaja(first);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = CajaService;
//# sourceMappingURL=CajaService.js.map