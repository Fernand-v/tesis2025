import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Grupo } from '../../types/Catalog';

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

const mapGrupo = (row: RowDataPacket): Grupo => ({
  codigo: Number(row.GRU_CODIGO),
  descripcion: String(row.GRU_DESC),
});

export default class GrupoService {
  static async list(): Promise<Grupo[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_grupo_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapGrupo);
  }

  static async create(descripcion: string): Promise<Grupo> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_grupo_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear el grupo');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar el grupo creado');
    }

    return mapGrupo(first);
  }

  static async update(codigo: number, descripcion: string): Promise<Grupo | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_grupo_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapGrupo(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_grupo_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
