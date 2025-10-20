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
const mapPerson = (row) => ({
    codigo: Number(row.PER_CODIGO),
    nombre: String(row.PER_NOMBRE),
    apellido: String(row.PER_APELLIDO),
    telefono: String(row.PER_TELEFONO),
    celular: String(row.PER_CELULAR),
    direccion: String(row.PER_DIRECCION ?? ''),
    activo: String(row.PER_ACTIVO ?? ''),
    correo: String(row.PER_CORREO ?? ''),
    ruc: String(row.PER_RUC ?? ''),
    documento: String(row.PER_DOC_IDENT ?? ''),
    digitoVerificador: String(row.PER_DIG_VERIFICADOR ?? ''),
    observacion: row.PER_OBS ?? null,
    estadoCivil: String(row.PER_ESTADO_CIVIL ?? ''),
    fechaNacimiento: row.PER_FEC_NAC ? String(row.PER_FEC_NAC) : '',
    tipoDocumentoCodigo: Number(row.PER_TIPO_DOC),
    tipoDocumentoDescripcion: String(row.TDOC_DESC ?? ''),
    fechaGrabacion: row.PER_FEC_GRAB ? String(row.PER_FEC_GRAB) : null,
});
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
const composeDetail = (resultSets) => {
    const [personaRows, assignedRows, availableRows] = resultSets;
    if (!personaRows || personaRows.length === 0) {
        return null;
    }
    const personaRow = personaRows[0];
    if (!personaRow) {
        return null;
    }
    return {
        persona: mapPerson(personaRow),
        assignedTypes: (assignedRows ?? []).map(mapPersonType),
        availableTypes: (availableRows ?? []).map(mapPersonType),
    };
};
class PersonService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_persona_list()');
        const [resultRows] = normalizeResultSets(rows);
        return (resultRows ?? []).map(mapPerson);
    }
    static async getDetail(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_persona_get(?)', [codigo]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_persona_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            data.nombre,
            data.apellido,
            data.telefono,
            data.celular,
            data.direccion,
            data.activo,
            data.correo,
            data.ruc,
            data.documento,
            data.digitoVerificador,
            data.observacion ?? null,
            data.estadoCivil,
            data.fechaNacimiento,
            data.tipoDocumentoCodigo,
        ]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
    static async update(codigo, data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_persona_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            codigo,
            data.nombre,
            data.apellido,
            data.telefono,
            data.celular,
            data.direccion,
            data.activo,
            data.correo,
            data.ruc,
            data.documento,
            data.digitoVerificador,
            data.observacion ?? null,
            data.estadoCivil,
            data.fechaNacimiento,
            data.tipoDocumentoCodigo,
        ]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_persona_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
    static async addType(personaCodigo, tipoCodigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_persona_add_tipo(?, ?)', [personaCodigo, tipoCodigo]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
    static async removeType(personaCodigo, tipoCodigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_persona_remove_tipo(?, ?)', [personaCodigo, tipoCodigo]);
        const resultSets = normalizeResultSets(rows);
        return composeDetail(resultSets);
    }
}
exports.default = PersonService;
//# sourceMappingURL=PersonService.js.map