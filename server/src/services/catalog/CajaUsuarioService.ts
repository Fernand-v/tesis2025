import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Caja, CajaUsuario, UsuarioBasico } from '../../types/Catalog';
import CajaService from './CajaService';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const extractAffected = (rows: unknown): number => {
  const sets = normalizeResultSets(rows);
  if (!sets[0] || sets[0].length === 0) {
    return 0;
  }

  const record = sets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

const findFirstSet = (rows: unknown): RowDataPacket[] => {
  const sets = normalizeResultSets(rows);
  for (const set of sets) {
    if (set.length > 0) {
      return set;
    }
  }
  return [];
};

const mapAsignacion = (row: RowDataPacket): CajaUsuario => ({
  cajaCodigo: Number(row.CAJU_CAJA),
  usuarioCodigo: Number(row.CAJU_USUARIO),
  cajaDescripcion: String(row.CAJ_DESC),
  usuarioUsername: String(row.USER_USUARIO),
  usuarioNombre: String(row.USER_NOMBRE),
  usuarioApellido: String(row.USER_APELLIDO),
});

const mapUsuario = (row: RowDataPacket): UsuarioBasico => ({
  codigo: Number(row.USER_CODIGO),
  username: String(row.USER_USUARIO),
  nombre: String(row.USER_NOMBRE),
  apellido: String(row.USER_APELLIDO),
  estado: Number(row.USER_ESTADO),
});

export default class CajaUsuarioService {
  static async listAsignaciones(): Promise<CajaUsuario[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_caj_a_user_list()');
    const resultRows = findFirstSet(rows);

    return resultRows.map(mapAsignacion);
  }

  static async listUsuarios(): Promise<UsuarioBasico[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_usuario_basic_list()');
    const resultRows = findFirstSet(rows);

    return resultRows.map(mapUsuario);
  }

  static async create(cajaCodigo: number, usuarioCodigo: number): Promise<CajaUsuario[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_caj_a_user_create(?, ?)', [cajaCodigo, usuarioCodigo]);
    const resultRows = findFirstSet(rows);

    return resultRows.map(mapAsignacion);
  }

  static async remove(cajaCodigo: number, usuarioCodigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_caj_a_user_delete(?, ?)', [cajaCodigo, usuarioCodigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }

  static async overview(): Promise<{ asignaciones: CajaUsuario[]; cajas: Caja[]; usuarios: UsuarioBasico[] }> {
    const [asignaciones, cajas, usuarios] = await Promise.all([
      this.listAsignaciones(),
      CajaService.list(),
      this.listUsuarios(),
    ]);

    return { asignaciones, cajas, usuarios };
  }
}

