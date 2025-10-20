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
const mapPersonType = (row) => ({
    codigo: Number(row.TPER_CODIGO),
    descripcion: String(row.TPER_DESC),
});
const extractAffected = (rows) => {
    const resultSets = normalizeResultSets(rows);
    if (!resultSets[0] || resultSets[0].length === 0) {
        return 0;
    }
    const record = resultSets[0][0];
    return Number(record.affected ?? 0);
};
class PersonTypeService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapPersonType);
    }
    static async create(descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_create(?)', [descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            throw new Error('No se pudo crear el tipo de persona');
        }
        const row = resultRows[0];
        if (!row) {
            throw new Error('No se pudo crear el tipo de persona');
        }
        return mapPersonType(row);
    }
    static async update(codigo, descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_update(?, ?)', [codigo, descripcion]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const row = resultRows[0];
        if (!row) {
            return null;
        }
        return mapPersonType(row);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = PersonTypeService;
//# sourceMappingURL=PersonTypeService.js.map