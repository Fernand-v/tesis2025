import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { PersonType } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapPersonType = (row: RowDataPacket): PersonType => ({
  codigo: Number(row.TPER_CODIGO),
  descripcion: String(row.TPER_DESC),
});

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class PersonTypeService {
  static async list(): Promise<PersonType[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapPersonType);
  }

  static async create(descripcion: string): Promise<PersonType> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear el tipo de persona');
    }

    const row = resultRows[0];

    if (!row) {
      throw new Error('No se pudo crear el tipo de persona');
    }

    return mapPersonType(row);
  }

  static async update(codigo: number, descripcion: string): Promise<PersonType | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const row = resultRows[0];

    if (!row) {
      return null;
    }

    return mapPersonType(row);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_persona_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
