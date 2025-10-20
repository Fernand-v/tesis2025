"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const pool_1 = __importDefault(require("../database/pool"));
const mapUser = (row) => ({
    id: row.USER_CODIGO,
    username: row.USER_USUARIO,
    nombre: row.USER_NOMBRE,
    apellido: row.USER_APELLIDO,
    correo: row.USER_CORREO,
    telefono: row.USER_TELEFONO,
    celular: row.USER_CELULAR,
    direccion: row.USER_DIRECCION,
    rol: row.USER_ROL,
    estado: row.USER_ESTADO,
});
const mapProgram = (row) => ({
    codigo: row.PRG_CODIGO,
    descripcion: row.PRG_DESC,
    ubicacion: row.PRG_UBICACION,
    formulario: row.PRG_FORMULARIO,
    tipoCodigo: row.PRG_TPO_PROG ?? null,
    tipoDescripcion: row.TPRO_DESC ?? null,
});
const normalizeResultSets = (rows) => {
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.filter((set) => Array.isArray(set));
};
class AuthService {
    static async register(payload) {
        const { username, password, nombre, apellido, correo, telefono, celular, direccion, grabUserId } = payload;
        const pool = (0, pool_1.default)();
        try {
            const [rows] = await pool.query('CALL tesis2025.sp_register_usuario(?,?,?,?,?,?,?,?,?)', [
                username,
                password,
                nombre,
                apellido,
                correo ?? null,
                telefono ?? null,
                celular ?? null,
                direccion ?? null,
                grabUserId ?? null,
            ]);
            const [createdRows] = normalizeResultSets(rows);
            if (!createdRows || createdRows.length === 0) {
                throw new Error('No se pudo registrar el usuario');
            }
            const user = mapUser(createdRows[0]);
            return { user };
        }
        catch (error) {
            const sqlMessage = typeof error === 'object' && error !== null && 'sqlMessage' in error
                ? String(error.sqlMessage ?? '')
                : '';
            const message = error instanceof Error ? error.message : '';
            if (sqlMessage.includes('El usuario ya se encuentra registrado') || message.includes('El usuario ya se encuentra registrado')) {
                throw new Error('El usuario ya se encuentra registrado');
            }
            throw error;
        }
    }
    static async login(payload) {
        const { username, password } = payload;
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_login_usuario(?, ?)', [username, password]);
        const [userRows] = normalizeResultSets(rows);
        if (!userRows || userRows.length === 0) {
            return null;
        }
        const user = mapUser(userRows[0]);
        if (user.rol === null || user.rol === 0 || user.estado === 0) {
            throw new Error('Usuario sin permisos de acceso');
        }
        const signOptions = { expiresIn: env_1.default.jwtExpiresIn };
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            username: user.username,
            role: user.rol,
        }, env_1.default.jwtSecret, signOptions);
        return { user, token };
    }
    static async getProfile(userId) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_perfil_usuario(?)', [userId]);
        const resultSets = normalizeResultSets(rows);
        const userRows = resultSets[0] ?? [];
        const programRows = resultSets[1] ?? [];
        if (userRows.length === 0) {
            return null;
        }
        const user = mapUser(userRows[0]);
        const programs = programRows.map((row) => mapProgram(row));
        return { user, programs };
    }
}
exports.default = AuthService;
//# sourceMappingURL=AuthService.js.map