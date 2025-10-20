import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { ProgramType } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapProgramType = (row: RowDataPacket): ProgramType => ({
  codigo: Number(row.TPRO_CODIGO),
  descripcion: String(row.TPRO_DESC),
});

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class ProgramTypeService {
  static async list(): Promise<ProgramType[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_programa_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapProgramType);
  }

  static async create(descripcion: string): Promise<ProgramType> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_programa_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear el tipo de programa');
    }

    const row = resultRows[0];

    if (!row) {
      throw new Error('No se pudo crear el tipo de programa');
    }

    return mapProgramType(row);
  }

  static async update(codigo: number, descripcion: string): Promise<ProgramType | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_programa_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const row = resultRows[0];

    if (!row) {
      return null;
    }

    return mapProgramType(row);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_programa_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
