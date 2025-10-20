import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Program } from '../../types/Program';
import { Role, RoleDetail } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapRole = (row: RowDataPacket): Role => ({
  codigo: Number(row.ROL_CODIGO),
  descripcion: String(row.ROL_DESC),
});

const mapProgram = (row: RowDataPacket): Program => ({
  codigo: Number(row.PRG_CODIGO),
  descripcion: String(row.PRG_DESC),
  ubicacion: String(row.PRG_UBICACION),
  formulario: String(row.PRG_FORMULARIO),
});

const composeDetail = (resultSets: RowDataPacket[][]): RoleDetail | null => {
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

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class RoleService {
  static async list(): Promise<Role[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_list()');
    const [roleRows] = normalizeResultSets(rows);

    return (roleRows ?? []).map(mapRole);
  }

  static async getDetail(codigo: number): Promise<RoleDetail | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_program_detail(?)', [codigo]);
    const resultSets = normalizeResultSets(rows);

    return composeDetail(resultSets);
  }

  static async create(descripcion: string): Promise<Role> {
    const pool = getPool();
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

  static async update(codigo: number, descripcion: string): Promise<Role | null> {
    const pool = getPool();
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

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }

  static async addProgram(codigo: number, programaCodigo: number): Promise<RoleDetail | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_add_program(?, ?)', [codigo, programaCodigo]);
    const resultSets = normalizeResultSets(rows);

    return composeDetail(resultSets);
  }

  static async removeProgram(codigo: number, programaCodigo: number): Promise<RoleDetail | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_rol_remove_program(?, ?)', [codigo, programaCodigo]);
    const resultSets = normalizeResultSets(rows);

    return composeDetail(resultSets);
  }

  static async listPrograms(): Promise<Program[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_habilitados()');
    const [programRows] = normalizeResultSets(rows);

    return (programRows ?? []).map(mapProgram);
  }
}
