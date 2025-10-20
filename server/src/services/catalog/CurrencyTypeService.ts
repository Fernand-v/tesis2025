import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { CurrencyType } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapCurrency = (row: RowDataPacket): CurrencyType => ({
  codigo: Number(row.TMON_CODIGO),
  denominacion: String(row.TMON_DENOMINACION),
  tasa: Number(row.TMON_TASA),
  simbolo: String(row.TMON_SIMBOLO),
});

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class CurrencyTypeService {
  static async list(): Promise<CurrencyType[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapCurrency);
  }

  static async get(codigo: number): Promise<CurrencyType | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_get(?)', [codigo]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      return null;
    }

    return mapCurrency(resultRow);
  }

  static async create(data: { denominacion: string; tasa: number; simbolo: string }): Promise<CurrencyType> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_create(?, ?, ?)', [
      data.denominacion,
      data.tasa,
      data.simbolo,
    ]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear el tipo de moneda');
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      throw new Error('No se pudo crear el tipo de moneda');
    }

    return mapCurrency(resultRow);
  }

  static async update(
    codigo: number,
    data: { denominacion: string; tasa: number; simbolo: string },
  ): Promise<CurrencyType | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_update(?, ?, ?, ?)', [
      codigo,
      data.denominacion,
      data.tasa,
      data.simbolo,
    ]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      return null;
    }

    return mapCurrency(resultRow);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_moneda_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
