import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Marca } from '../../types/Catalog';

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

const mapMarca = (row: RowDataPacket): Marca => ({
  codigo: Number(row.MAR_CODIGO),
  descripcion: String(row.MAR_DESC),
});

export default class MarcaService {
  static async list(): Promise<Marca[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_marca_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapMarca);
  }

  static async create(descripcion: string): Promise<Marca> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_marca_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear la marca');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar la marca creada');
    }

    return mapMarca(first);
  }

  static async update(codigo: number, descripcion: string): Promise<Marca | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_marca_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapMarca(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_marca_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
