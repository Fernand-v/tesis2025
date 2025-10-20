import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Empresa } from '../../types/Catalog';

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

const mapEmpresa = (row: RowDataPacket): Empresa => ({
  codigo: Number(row.EMPR_CODIGO),
  razonSocial: String(row.EMPR_RAZON_SOCIAL),
  ruc: String(row.EMPR_RUC),
  telefono: row.EMPR_TELEFONO === null ? null : String(row.EMPR_TELEFONO),
  celular: String(row.EMPR_CELULAR),
  direccion: String(row.EMPR_DIRECCION),
  logo: row.EMPR_LOGO === null ? null : String(row.EMPR_LOGO),
});

export default class EmpresaService {
  static async list(): Promise<Empresa[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_list()');
    const [resultRows] = normalizeResultSets(rows);

    return (resultRows ?? []).map(mapEmpresa);
  }

  static async get(codigo: number): Promise<Empresa | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_get(?)', [codigo]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapEmpresa(first);
  }

  static async create(data: {
    razonSocial: string;
    ruc: string;
    telefono: string | null;
    celular: string;
    direccion: string;
    logo: string | null;
  }): Promise<Empresa> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_create(?, ?, ?, ?, ?, ?)', [
      data.razonSocial,
      data.ruc,
      data.telefono,
      data.celular,
      data.direccion,
      data.logo,
    ]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      throw new Error('No se pudo crear la empresa');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar la empresa creada');
    }

    return mapEmpresa(first);
  }

  static async update(
    codigo: number,
    data: {
      razonSocial: string;
      ruc: string;
      telefono: string | null;
      celular: string;
      direccion: string;
      logo: string | null;
    },
  ): Promise<Empresa | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_update(?, ?, ?, ?, ?, ?, ?)', [
      codigo,
      data.razonSocial,
      data.ruc,
      data.telefono,
      data.celular,
      data.direccion,
      data.logo,
    ]);
    const [resultRows] = normalizeResultSets(rows);

    if (!resultRows || resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapEmpresa(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_empresa_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}
