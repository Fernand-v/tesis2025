import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Motivo } from '../../types/Catalog';

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

const mapMotivo = (row: RowDataPacket): Motivo => ({
  codigo: Number(row.MOT_CODIGO),
  descripcion: String(row.MOT_DESC),
});

export default class MotivoService {
  static async list(): Promise<Motivo[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_motivo_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapMotivo);
  }

  static async create(descripcion: string): Promise<Motivo> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_motivo_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear el motivo');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar el motivo creado');
    }

    return mapMotivo(first);
  }

  static async update(codigo: number, descripcion: string): Promise<Motivo | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_motivo_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapMotivo(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_motivo_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
