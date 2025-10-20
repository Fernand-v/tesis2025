import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Caja } from '../../types/Catalog';

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

const mapCaja = (row: RowDataPacket): Caja => ({
  codigo: Number(row.CAJ_CODIGO),
  descripcion: String(row.CAJ_DESC),
});

export default class CajaService {
  static async list(): Promise<Caja[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapCaja);
  }

  static async create(descripcion: string): Promise<Caja> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear la caja');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar la caja creada');
    }

    return mapCaja(first);
  }

  static async update(codigo: number, descripcion: string): Promise<Caja | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapCaja(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_caja_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
