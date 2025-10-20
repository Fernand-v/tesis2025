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
const mapRole = (row) => ({
    codigo: Number(row.ROL_CODIGO),
    descripcion: String(row.ROL_DESC),
});
const mapProgram = (row) => ({
    codigo: Number(row.PRG_CODIGO),
    descripcion: String(row.PRG_DESC),
    ubicacion: String(row.PRG_UBICACION),
    formulario: String(row.PRG_FORMULARIO),
});
const composeDetail = (resultSets) => {
    const [roleRows, assignedRows, availableRows] = resultSets;
    if (!roleRows || roleRows.length === 0) {
        return null;
    }
    const roleRow = roleRows[0];
    if (!roleRow) {
        return null;
    }
    return {
        role: mapRole(roleRow),
        assignedPrograms: (assignedRows ?? []).map(mapProgram),
        availablePrograms: (availableRows ?? []).map(mapProgram),
    };
};
const extractAffected = (rows) => {
    const resultSets = normalizeResultSets(rows);
    if (!resultSets[0] || resultSets[0].length === 0) {
        return 0;
    }
    const record = resultSets[0][0];
    return Number(record.affected ?? 0);
};
class RoleService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_list()');
        const [roleRows] = normalizeResultSets(rows);
        return (roleRows ?? []).map(mapRole);
    }
    static async getDetail(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_program_detail(?)', [codigo]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
    static async create(descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_create(?)', [descripcion]);
        const [roleRows] = normalizeResultSets(rows);
        if (!roleRows || roleRows.length === 0) {
            throw new Error('No se pudo crear el rol');
        }
        const roleRow = roleRows[0];
        if (!roleRow) {
            throw new Error('No se pudo crear el rol');
        }
        return mapRole(roleRow);
    }
    static async update(codigo, descripcion) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_update(?, ?)', [codigo, descripcion]);
        const [roleRows] = normalizeResultSets(rows);
        if (!roleRows || roleRows.length === 0) {
            return null;
        }
        const roleRow = roleRows[0];
        if (!roleRow) {
            return null;
        }
        return mapRole(roleRow);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
    static async addProgram(codigo, programaCodigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_add_program(?, ?)', [codigo, programaCodigo]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
    static async removeProgram(codigo, programaCodigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_remove_program(?, ?)', [codigo, programaCodigo]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
    static async listPrograms() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_habilitados()');
        const [programRows] = normalizeResultSets(rows);
        return (programRows ?? []).map(mapProgram);
    }
}
exports.default = RoleService;
//# sourceMappingURL=RoleService.js.map