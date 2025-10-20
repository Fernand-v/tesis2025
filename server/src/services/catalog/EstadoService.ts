import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Estado } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapEstado = (row: RowDataPacket): Estado => ({
  codigo: Number(row.EST_CODIGO),
  descripcion: String(row.EST_DESC),
});

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class EstadoService {
  static async list(): Promise<Estado[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapEstado);
  }

  static async get(codigo: number): Promise<Estado | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_get(?)', [codigo]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      return null;
    }

    return mapEstado(resultRow);
  }

  static async create(descripcion: string): Promise<Estado> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear el estado');
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      throw new Error('No se pudo crear el estado');
    }

    return mapEstado(resultRow);
  }

  static async update(codigo: number, descripcion: string): Promise<Estado | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      return null;
    }

    return mapEstado(resultRow);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_estado_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
