import { RowDataPacket } from 'mysql2/promise';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

import config from '../config/env';
import getPool from '../database/pool';
import { User } from '../types/User';
import { Program } from '../types/Program';

export interface RegisterPayload {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  grabUserId?: number | null;
}

export interface LoginPayload {
  username: string;
  password: string;
}

const mapUser = (row: RowDataPacket): User => ({
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

const mapProgram = (row: RowDataPacket): Program => ({
  codigo: row.PRG_CODIGO,
  descripcion: row.PRG_DESC,
  ubicacion: row.PRG_UBICACION,
  formulario: row.PRG_FORMULARIO,
  tipoCodigo: row.PRG_TPO_PROG ?? null,
  tipoDescripcion: row.TPRO_DESC ?? null,
});

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

export default class AuthService {
  static async register(payload: RegisterPayload) {
    const { username, password, nombre, apellido, correo, telefono, celular, direccion, grabUserId } = payload;

    const pool = getPool();

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

      const user = mapUser(createdRows[0] as RowDataPacket);

      return { user };
    } catch (error) {
      const sqlMessage =
        typeof error === 'object' && error !== null && 'sqlMessage' in error
          ? String((error as { sqlMessage?: string }).sqlMessage ?? '')
          : '';
      const message = error instanceof Error ? error.message : '';

      if (sqlMessage.includes('El usuario ya se encuentra registrado') || message.includes('El usuario ya se encuentra registrado')) {
        throw new Error('El usuario ya se encuentra registrado');
      }

      throw error;
    }
  }

  static async login(payload: LoginPayload) {
    const { username, password } = payload;
    const pool = getPool();

    const [rows] = await pool.query('CALL tesis2025.sp_login_usuario(?, ?)', [username, password]);
    const [userRows] = normalizeResultSets(rows);

    if (!userRows || userRows.length === 0) {
      return null;
    }

    const user = mapUser(userRows[0] as RowDataPacket);

    if (user.rol === null || user.rol === 0 || user.estado === 0) {
      throw new Error('Usuario sin permisos de acceso');
    }

    const signOptions: SignOptions = { expiresIn: config.jwtExpiresIn };

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.rol,
      },
      config.jwtSecret as Secret,
      signOptions,
    );

    return { user, token };
  }

  static async getProfile(userId: number) {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_perfil_usuario(?)', [userId]);
    const resultSets = normalizeResultSets(rows);

    const userRows = resultSets[0] ?? [];
    const programRows = resultSets[1] ?? [];

    if (userRows.length === 0) {
      return null;
    }

    const user = mapUser(userRows[0] as RowDataPacket);
    const programs = programRows.map((row) => mapProgram(row as RowDataPacket));

    return { user, programs };
  }
}
