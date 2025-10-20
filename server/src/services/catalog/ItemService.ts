import { RowDataPacket } from 'mysql2/promise';
import getPool from '../../database/pool';
import {
  CategoriaIva,
  Grupo,
  Item,
  ItemInput,
  Marca,
} from '../../types/Catalog';
import GrupoService from './GrupoService';
import MarcaService from './MarcaService';

/**
 * Normaliza los resultados de MySQL cuando se usan procedimientos almacenados.
 */
const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) return [];
  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

/**
 * Extrae cantidad de filas afectadas de un conjunto de resultados.
 */
const extractAffected = (rows: unknown): number => {
  const sets = normalizeResultSets(rows);
  if (!sets[0] || sets[0].length === 0) return 0;
  const record = sets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

/**
 * Encuentra el primer conjunto de resultados no vacío.
 */
const findFirstSet = (rows: unknown): RowDataPacket[] => {
  const sets = normalizeResultSets(rows);
  for (const set of sets) {
    if (set.length > 0) return set;
  }
  return [];
};

/**
 * Mapeo de filas SQL a objetos Item.
 */
const mapItem = (row: RowDataPacket): Item => ({
  codigo: Number(row.ITEM_CODIGO),
  descripcion: String(row.ITEM_DESC),
  codigoBarra: row.ITEM_COD_BARRA === null ? null : String(row.ITEM_COD_BARRA),
  activo: String(row.ITEM_ACTIVO),
  afectaStock: String(row.ITEM_AFECTA_STOCK),
  marcaCodigo: Number(row.ITEM_MARCA),
  marcaDescripcion: String(row.MAR_DESC),
  grupoCodigo: Number(row.ITEM_GRUPO),
  grupoDescripcion: String(row.GRU_DESC),
  categoriaCodigo: Number(row.ITEM_CAT_IVA),
  categoriaDescripcion: String(row.CAT_DESC),
  categoriaTasa: Number(row.CAT_IVA),
  porcGanancia: Number(row.ITEM_PORC_GANANCIA ?? 0),
  indDescuento: String(row.ITEM_IND_DESCUENTO ?? 'N'),
});

/**
 * Mapeo de filas SQL a categorías de IVA.
 */
const mapCategoria = (row: RowDataPacket): CategoriaIva => ({
  codigo: Number(row.CAT_CODIGO),
  descripcion: String(row.CAT_DESC),
  tasa: Number(row.CAT_IVA),
});

export default class ItemService {
  // === LISTAR ITEMS ===
  static async list(): Promise<Item[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_item_list()');
    const resultRows = findFirstSet(rows);
    return resultRows.map(mapItem);
  }

  // === OBTENER ITEM POR CÓDIGO ===
  static async get(codigo: number): Promise<Item | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_item_get(?)', [codigo]);
    const resultRows = findFirstSet(rows);
    const first = resultRows[0];
    return first ? mapItem(first) : null;
  }

  // === CREAR ITEM ===
  static async create(data: ItemInput): Promise<Item> {
    const pool = getPool();
    const [rows] = await pool.query(
      'CALL tesis2025.sp_stk_item_create(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.descripcion,
        data.codigoBarra,
        data.activo,
        data.afectaStock,
        data.marcaCodigo,
        data.grupoCodigo,
        data.categoriaCodigo,
        data.porcGanancia,
        data.indDescuento,
      ]
    );

    const resultRows = findFirstSet(rows);
    const first = resultRows[0];
    if (!first) throw new Error('No se pudo crear el item');
    return mapItem(first);
  }

  // === ACTUALIZAR ITEM ===
  static async update(codigo: number, data: ItemInput): Promise<Item | null> {
    const pool = getPool();
    const [rows] = await pool.query(
      'CALL tesis2025.sp_stk_item_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        codigo,
        data.descripcion,
        data.codigoBarra,
        data.activo,
        data.afectaStock,
        data.marcaCodigo,
        data.grupoCodigo,
        data.categoriaCodigo,
        data.porcGanancia,
        data.indDescuento,
      ]
    );

    const resultRows = findFirstSet(rows);
    const first = resultRows[0];
    return first ? mapItem(first) : null;
  }

  // === ELIMINAR ITEM ===
  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_item_delete(?)', [codigo]);
    const affected = extractAffected(rows);
    return affected > 0;
  }

  // === LISTAR CATEGORÍAS IVA ===
  static async listCategorias(): Promise<CategoriaIva[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_stk_categoria_iva_list()');
    const resultRows = findFirstSet(rows);
    return resultRows.map(mapCategoria);
  }

  // === OVERVIEW (para front) ===
  static async overview(): Promise<{
    items: Item[];
    grupos: Grupo[];
    marcas: Marca[];
    categorias: CategoriaIva[];
  }> {
    const [items, grupos, marcas, categorias] = await Promise.all([
      this.list(),
      GrupoService.list(),
      MarcaService.list(),
      this.listCategorias(),
    ]);
    return { items, grupos, marcas, categorias };
  }
}
