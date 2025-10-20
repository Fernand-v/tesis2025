import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { ProgramCatalog } from '../../types/Catalog';
import ProgramTypeService from './ProgramTypeService';

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

const findFirstSet = (rows: unknown): RowDataPacket[] => {
  const sets = normalizeResultSets(rows);
  for (const set of sets) {
    if (set.length > 0) {
      return set;
    }
  }
  return [];
};

const mapProgram = (row: RowDataPacket): ProgramCatalog => ({
  codigo: Number(row.PRG_CODIGO),
  descripcion: String(row.PRG_DESC),
  ubicacion: String(row.PRG_UBICACION),
  formulario: String(row.PRG_FORMULARIO),
  habilitado: Number(row.PRG_HABILITADO),
  tipoCodigo: Number(row.PRG_TPO_PROG),
  tipoDescripcion: String(row.TPRO_DESC),
});

export default class ProgramService {
  static async list(): Promise<ProgramCatalog[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_list()');
    const resultRows = findFirstSet(rows);

    return resultRows.map(mapProgram);
  }

  static async create(data: {
    descripcion: string;
    ubicacion: string;
    formulario: string;
    habilitado: number;
    tipoCodigo: number;
  }): Promise<ProgramCatalog> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_create(?, ?, ?, ?, ?)', [
      data.descripcion,
      data.ubicacion,
      data.formulario,
      data.habilitado,
      data.tipoCodigo,
    ]);
    const resultRows = findFirstSet(rows);

    if (resultRows.length === 0) {
      throw new Error('No se pudo crear el programa');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar el programa creado');
    }

    return mapProgram(first);
  }

  static async update(
    codigo: number,
    data: {
      descripcion: string;
      ubicacion: string;
      formulario: string;
      habilitado: number;
      tipoCodigo: number;
    },
  ): Promise<ProgramCatalog | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_update(?, ?, ?, ?, ?, ?)', [
      codigo,
      data.descripcion,
      data.ubicacion,
      data.formulario,
      data.habilitado,
      data.tipoCodigo,
    ]);
    const resultRows = findFirstSet(rows);

    if (resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapProgram(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_programa_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }

  static async overview() {
    const [programas, tipos] = await Promise.all([this.list(), ProgramTypeService.list()]);
    return { programas, tipos };
  }
}
