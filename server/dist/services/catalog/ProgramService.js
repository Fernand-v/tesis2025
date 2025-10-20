"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = __importDefault(require("../../database/pool"));
const ProgramTypeService_1 = __importDefault(require("./ProgramTypeService"));
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
const mapProgram = (row) => ({
    codigo: Number(row.PRG_CODIGO),
    descripcion: String(row.PRG_DESC),
    ubicacion: String(row.PRG_UBICACION),
    formulario: String(row.PRG_FORMULARIO),
    habilitado: Number(row.PRG_HABILITADO),
    tipoCodigo: Number(row.PRG_TPO_PROG),
    tipoDescripcion: String(row.TPRO_DESC),
});
class ProgramService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapProgram);
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_create(?, ?, ?, ?, ?)', [
            data.descripcion,
            data.ubicacion,
            data.formulario,
            data.habilitado,
            data.tipoCodigo,
        ]);
        const resultRows = findFirstSet(rows);
        if (resultRows.length === 0) {
            throw new Error('No se pudo crear el programa');
        }
        const first = resultRows[0];
        if (!first) {
            throw new Error('No se pudo recuperar el programa creado');
        }
        return mapProgram(first);
    }
    static async update(codigo, data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_update(?, ?, ?, ?, ?, ?)', [
            codigo,
            data.descripcion,
            data.ubicacion,
            data.formulario,
            data.habilitado,
            data.tipoCodigo,
        ]);
        const resultRows = findFirstSet(rows);
        if (resultRows.length === 0) {
            return null;
        }
        const first = resultRows[0];
        if (!first) {
            return null;
        }
        return mapProgram(first);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
    static async overview() {
        const [programas, tipos] = await Promise.all([this.list(), ProgramTypeService_1.default.list()]);
        return { programas, tipos };
    }
}
exports.default = ProgramService;
//# sourceMappingURL=ProgramService.js.map