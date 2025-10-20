import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { CategoriaIva } from '../../types/Catalog';

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

const mapCategoria = (row: RowDataPacket): CategoriaIva => ({
  codigo: Number(row.CAT_CODIGO),
  descripcion: String(row.CAT_DESC),
  tasa: Number(row.CAT_IVA),
});

export default class CategoriaIvaService {
  static async list(): Promise<CategoriaIva[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_categoria_iva_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapCategoria);
  }

  static async create(descripcion: string, tasa: number): Promise<CategoriaIva> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_categoria_iva_create(?, ?)', [descripcion, tasa]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear la categoria de IVA');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar la categoria creada');
    }

    return mapCategoria(first);
  }

  static async update(codigo: number, descripcion: string, tasa: number): Promise<CategoriaIva | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_categoria_iva_update(?, ?, ?)', [
      codigo,
      descripcion,
      tasa,
    ]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapCategoria(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_categoria_iva_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
