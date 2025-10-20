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
const findFirstSet = (rows) => {
    const sets = normalizeResultSets(rows);
    for (const set of sets) {
        if (set.length > 0) {
            return set;
        }
    }
    return [];
};
const mapDispositivo = (row) => ({
    codigo: Number(row.DIS_CODIGO),
    descripcion: String(row.DIS_DESC),
    modeloCodigo: Number(row.DIS_MODELO),
    modeloDescripcion: String(row.MOD_DESC),
    marcaCodigo: Number(row.DIS_MARCA),
    marcaDescripcion: String(row.MAR_DESC),
    ram: Number(row.DIS_RAM),
    rom: Number(row.DIS_ROM),
});
const mapModelo = (row) => ({
    codigo: Number(row.MOD_CODIGO),
    descripcion: String(row.MOD_DESC),
});
const mapMarca = (row) => ({
    codigo: Number(row.MAR_CODIGO),
    descripcion: String(row.MAR_DESC),
});
class DispositivoService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapDispositivo);
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_create(?, ?, ?, ?, ?)', [
            data.descripcion,
            data.modeloCodigo,
            data.marcaCodigo,
            data.ram,
            data.rom,
        ]);
        const resultRows = findFirstSet(rows);
        if (resultRows.length === 0) {
            throw new Error('No se pudo crear el dispositivo');
        }
        const first = resultRows[0];
        if (!first) {
            throw new Error('No se pudo recuperar el dispositivo creado');
        }
        return mapDispositivo(first);
    }
    static async update(codigo, data) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_update(?, ?, ?, ?, ?, ?)', [
            codigo,
            data.descripcion,
            data.modeloCodigo,
            data.marcaCodigo,
            data.ram,
            data.rom,
        ]);
        const resultRows = findFirstSet(rows);
        if (resultRows.length === 0) {
            return null;
        }
        const first = resultRows[0];
        if (!first) {
            return null;
        }
        return mapDispositivo(first);
    }
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
    static async listModelos() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_modelo_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapModelo);
    }
    static async listMarcas() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_stk_marca_list()');
        const resultRows = findFirstSet(rows);
        return resultRows.map(mapMarca);
    }
    static async lookups() {
        const [modelos, marcas] = await Promise.all([this.listModelos(), this.listMarcas()]);
        return { modelos, marcas };
    }
}
exports.default = DispositivoService;
//# sourceMappingURL=DispositivoService.js.map