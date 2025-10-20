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
const mapEstado = (row) => ({
    codigo: Number(row.EST_CODIGO),
    descripcion: String(row.EST_DESC),
});
const extractAffected = (rows) => {
    const resultSets = normalizeResultSets(rows);
    if (!resultSets[0] || resultSets[0].length === 0) {
        return 0;
    }
    const record = resultSets[0][0];
    return Number(record.affected ?? 0);
};
class EstadoService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapEstado);
    }
    static async get(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_get(?)', [codigo]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            return null;
        }
        return mapEstado(resultRow);
    }
    static async create(descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_create(?)', [descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            throw new Error('No se pudo crear el estado');
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            throw new Error('No se pudo crear el estado');
        }
        return mapEstado(resultRow);
    }
    static async update(codigo, descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_update(?, ?)', [codigo, descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            return null;
        }
        return mapEstado(resultRow);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = EstadoService;
//# sourceMappingURL=EstadoService.js.map