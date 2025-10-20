import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Timbrado } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapTimbrado = (row: RowDataPacket): Timbrado => ({
  codigo: Number(row.TIMB_CODIGO),
  numero: String(row.TIMB_NRO),
  fechaInicio: String(row.TIMB_FECHA_INI),
  fechaFin: String(row.TIMB_FECHA_FIN),
  digitoDesde: String(row.TIMB_DIGITO_DESDE),
  digitoHasta: String(row.TIMB_DIGITO_HASTA),
  activo: String(row.TIMB_ACTIVO),
  autorizacion: String(row.TIMB_AUTORIZACION),
  puntoExpedicion: Number(row.TIMB_PUNTO_EXP),
  establecimiento: Number(row.TIMB_ESTABLECIMIENTO),
});

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class TimbradoService {
  static async list(): Promise<Timbrado[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapTimbrado);
  }

  static async get(codigo: number): Promise<Timbrado | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_get(?)', [codigo]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      return null;
    }

    return mapTimbrado(resultRow);
  }

  static async create(data: Omit<Timbrado, 'codigo'>): Promise<Timbrado> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_create(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      data.numero,
      data.fechaInicio,
      data.fechaFin,
      data.digitoDesde,
      data.digitoHasta,
      data.activo,
      data.autorizacion,
      data.puntoExpedicion,
      data.establecimiento,
    ]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear el timbrado');
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      throw new Error('No se pudo crear el timbrado');
    }

    return mapTimbrado(resultRow);
  }

  static async update(codigo: number, data: Omit<Timbrado, 'codigo'>): Promise<Timbrado | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      codigo,
      data.numero,
      data.fechaInicio,
      data.fechaFin,
      data.digitoDesde,
      data.digitoHasta,
      data.activo,
      data.autorizacion,
      data.puntoExpedicion,
      data.establecimiento,
    ]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const resultRow = resultRows[0];

    if (!resultRow) {
      return null;
    }

    return mapTimbrado(resultRow);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_fin_timbrado_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
