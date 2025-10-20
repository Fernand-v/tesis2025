import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { PaymentMethod } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapPaymentMethod = (row: RowDataPacket): PaymentMethod => ({
  codigo: Number(row.FPAG_CODIGO),
  descripcion: String(row.FPAG_DESC),
});

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class PaymentMethodService {
  static async list(): Promise<PaymentMethod[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_forma_pago_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapPaymentMethod);
  }

  static async create(descripcion: string): Promise<PaymentMethod> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_forma_pago_create(?)', [descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear la forma de pago');
    }

    const row = resultRows[0];

    if (!row) {
      throw new Error('No se pudo crear la forma de pago');
    }

    return mapPaymentMethod(row);
  }

  static async update(codigo: number, descripcion: string): Promise<PaymentMethod | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_forma_pago_update(?, ?)', [codigo, descripcion]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const row = resultRows[0];

    if (!row) {
      return null;
    }

    return mapPaymentMethod(row);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_forma_pago_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
