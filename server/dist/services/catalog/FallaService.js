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
const mapFalla = (row) => ({
    codigo: Number(row.FAL_CODIGO),
    descripcion: String(row.FAL_DESC),
});
const extractAffected = (rows) => {
    const resultSets = normalizeResultSets(rows);
    if (!resultSets[0] || resultSets[0].length === 0) {
        return 0;
    }
    const record = resultSets[0][0];
    return Number(record.affected ?? 0);
};
class FallaService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_falla_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapFalla);
    }
    static async create(descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_falla_create(?)', [descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            throw new Error('No se pudo crear la falla');
        }
        const row = resultRows[0];
        if (!row) {
            throw new Error('No se pudo crear la falla');
        }
        return mapFalla(row);
    }
    static async update(codigo, descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_falla_update(?, ?)', [codigo, descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const row = resultRows[0];
        if (!row) {
            return null;
        }
        return mapFalla(row);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_falla_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = FallaService;
//# sourceMappingURL=FallaService.js.map