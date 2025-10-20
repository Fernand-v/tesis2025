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
const mapEmpresa = (row) => ({
    codigo: Number(row.EMPR_CODIGO),
    razonSocial: String(row.EMPR_RAZON_SOCIAL),
    ruc: String(row.EMPR_RUC),
    telefono: row.EMPR_TELEFONO === null ? null : String(row.EMPR_TELEFONO),
    celular: String(row.EMPR_CELULAR),
    direccion: String(row.EMPR_DIRECCION),
    logo: row.EMPR_LOGO === null ? null : String(row.EMPR_LOGO),
});
class EmpresaService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapEmpresa);
    }
    static async get(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_get(?)', [codigo]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const first = resultRows[0];
        if (!first) {
            return null;
        }
        return mapEmpresa(first);
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_create(?, ?, ?, ?, ?, ?)', [
            data.razonSocial,
            data.ruc,
            data.telefono,
            data.celular,
            data.direccion,
            data.logo,
        ]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            throw new Error('No se pudo crear la empresa');
        }
        const first = resultRows[0];
        if (!first) {
            throw new Error('No se pudo recuperar la empresa creada');
        }
        return mapEmpresa(first);
    }
    static async update(codigo, data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_update(?, ?, ?, ?, ?, ?, ?)', [
            codigo,
            data.razonSocial,
            data.ruc,
            data.telefono,
            data.celular,
            data.direccion,
            data.logo,
        ]);
        const [resultRows] = normalizeResultSets(rows);
        if (!resultRows || resultRows.length === 0) {
            return null;
        }
        const first = resultRows[0];
        if (!first) {
            return null;
        }
        return mapEmpresa(first);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = EmpresaService;
//# sourceMappingURL=EmpresaService.js.map