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
const mapTimbrado = (row) => ({
    codigo: Number(row.TIMB_CODIGO),
    numero: String(row.TIMB_NRO),
    fechaInicio: String(row.TIMB_FECHA_INI),
    fechaFin: String(row.TIMB_FECHA_FIN),
    digitoDesde: String(row.TIMB_DIGITO_DESDE),
    digitoHasta: String(row.TIMB_DIGITO_HASTA),
    activo: String(row.TIMB_ACTIVO),
    autorizacion: String(row.TIMB_AUTORIZACION),
    puntoExpedicion: Number(row.TIMB_PUNTO_EXP),
    establecimiento: Number(row.TIMB_ESTABLECIMIENTO),
});
const extractAffected = (rows) => {
    const resultSets = normalizeResultSets(rows);
    if (!resultSets[0] || resultSets[0].length === 0) {
        return 0;
    }
    const record = resultSets[0][0];
    return Number(record.affected ?? 0);
};
class TimbradoService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapTimbrado);
    }
    static async get(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_get(?)', [codigo]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            return null;
        }
        return mapTimbrado(resultRow);
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_create(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            data.numero,
            data.fechaInicio,
            data.fechaFin,
            data.digitoDesde,
            data.digitoHasta,
            data.activo,
            data.autorizacion,
            data.puntoExpedicion,
            data.establecimiento,
        ]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            throw new Error('No se pudo crear el timbrado');
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            throw new Error('No se pudo crear el timbrado');
        }
        return mapTimbrado(resultRow);
    }
    static async update(codigo, data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            codigo,
            data.numero,
            data.fechaInicio,
            data.fechaFin,
            data.digitoDesde,
            data.digitoHasta,
            data.activo,
            data.autorizacion,
            data.puntoExpedicion,
            data.establecimiento,
        ]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const resultRow = resultRows[0];
        if (!resultRow) {
            return null;
        }
        return mapTimbrado(resultRow);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = TimbradoService;
//# sourceMappingURL=TimbradoService.js.map