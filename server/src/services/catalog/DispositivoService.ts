import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { Dispositivo, Marca, Modelo } from '../../types/Catalog';

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

const mapDispositivo = (row: RowDataPacket): Dispositivo => ({
  codigo: Number(row.DIS_CODIGO),
  descripcion: String(row.DIS_DESC),
  modeloCodigo: Number(row.DIS_MODELO),
  modeloDescripcion: String(row.MOD_DESC),
  marcaCodigo: Number(row.DIS_MARCA),
  marcaDescripcion: String(row.MAR_DESC),
  ram: Number(row.DIS_RAM),
  rom: Number(row.DIS_ROM),
});

const mapModelo = (row: RowDataPacket): Modelo => ({
  codigo: Number(row.MOD_CODIGO),
  descripcion: String(row.MOD_DESC),
});

const mapMarca = (row: RowDataPacket): Marca => ({
  codigo: Number(row.MAR_CODIGO),
  descripcion: String(row.MAR_DESC),
});

export default class DispositivoService {
  static async list(): Promise<Dispositivo[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_list()');
    const resultRows = findFirstSet(rows);

    return resultRows.map(mapDispositivo);
  }

  static async create(data: {
    descripcion: string;
    modeloCodigo: number;
    marcaCodigo: number;
    ram: number;
    rom: number;
  }): Promise<Dispositivo> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_create(?, ?, ?, ?, ?)', [
      data.descripcion,
      data.modeloCodigo,
      data.marcaCodigo,
      data.ram,
      data.rom,
    ]);
    const resultRows = findFirstSet(rows);

    if (resultRows.length === 0) {
      throw new Error('No se pudo crear el dispositivo');
    }

    const first = resultRows[0];
    if (!first) {
      throw new Error('No se pudo recuperar el dispositivo creado');
    }

    return mapDispositivo(first);
  }

  static async update(
    codigo: number,
    data: {
      descripcion: string;
      modeloCodigo: number;
      marcaCodigo: number;
      ram: number;
      rom: number;
    },
  ): Promise<Dispositivo | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_update(?, ?, ?, ?, ?, ?)', [
      codigo,
      data.descripcion,
      data.modeloCodigo,
      data.marcaCodigo,
      data.ram,
      data.rom,
    ]);
    const resultRows = findFirstSet(rows);

    if (resultRows.length === 0) {
      return null;
    }

    const first = resultRows[0];
    if (!first) {
      return null;
    }

    return mapDispositivo(first);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_dispositivo_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }

  static async listModelos(): Promise<Modelo[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_modelo_list()');
    const resultRows = findFirstSet(rows);

    return resultRows.map(mapModelo);
  }

  static async listMarcas(): Promise<Marca[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_marca_list()');
    const resultRows = findFirstSet(rows);

    return resultRows.map(mapMarca);
  }

  static async lookups(): Promise<{ modelos: Modelo[]; marcas: Marca[] }> {
    const [modelos, marcas] = await Promise.all([this.listModelos(), this.listMarcas()]);

    return { modelos, marcas };
  }
}
