"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = __importDefault(require("../../database/pool"));
const CajaService_1 = __importDefault(require("./CajaService"));
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
const findFirstSet = (rows) => {
    const sets = normalizeResultSets(rows);
    for (const set of sets) {
        if (set.length > 0) {
            return set;
        }
    }
    return [];
};
const mapAsignacion = (row) => ({
    cajaCodigo: Number(row.CAJU_CAJA),
    usuarioCodigo: Number(row.CAJU_USUARIO),
    cajaDescripcion: String(row.CAJ_DESC),
    usuarioUsername: String(row.USER_USUARIO),
    usuarioNombre: String(row.USER_NOMBRE),
    usuarioApellido: String(row.USER_APELLIDO),
});
const mapUsuario = (row) => ({
    codigo: Number(row.USER_CODIGO),
    username: String(row.USER_USUARIO),
    nombre: String(row.USER_NOMBRE),
    apellido: String(row.USER_APELLIDO),
    estado: Number(row.USER_ESTADO),
});
class CajaUsuarioService {
    static async listAsignaciones() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_caj_a_user_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapAsignacion);
    }
    static async listUsuarios() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_usuario_basic_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapUsuario);
    }
    static async create(cajaCodigo, usuarioCodigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_caj_a_user_create(?, ?)', [cajaCodigo, usuarioCodigo]);
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapAsignacion);
    }
    static async remove(cajaCodigo, usuarioCodigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_caj_a_user_delete(?, ?)', [cajaCodigo, usuarioCodigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
    static async overview() {
        const [asignaciones, cajas, usuarios] = await Promise.all([
            this.listAsignaciones(),
            CajaService_1.default.list(),
            this.listUsuarios(),
        ]);
        return { asignaciones, cajas, usuarios };
    }
}
exports.default = CajaUsuarioService;
//# sourceMappingURL=CajaUsuarioService.js.map