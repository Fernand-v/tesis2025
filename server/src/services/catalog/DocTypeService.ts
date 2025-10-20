import { RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import { DocType } from '../../types/Catalog';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
};

const mapDocType = (row: RowDataPacket): DocType => ({
  codigo: Number(row.TDOC_CODIGO),
  descripcion: String(row.TDOC_DESC),
});

const extractAffected = (rows: unknown): number => {
  const resultSets = normalizeResultSets(rows);
  if (!resultSets[0] || resultSets[0].length === 0) {
    return 0;
  }

  const record = resultSets[0][0] as RowDataPacket & { affected?: unknown };
  return Number(record.affected ?? 0);
};

export default class DocTypeService {
  static async list(): Promise<DocType[]> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_doc_list()');
    const [docRows] = normalizeResultSets(rows);

    return (docRows ?? []).map(mapDocType);
  }

  static async get(codigo: number): Promise<DocType | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_doc_get(?)', [codigo]);
    const [docRows] = normalizeResultSets(rows);

    if (!docRows || docRows.length === 0) {
      return null;
    }

    const docRow = docRows[0];

    if (!docRow) {
      return null;
    }

    return mapDocType(docRow);
  }

  static async create(descripcion: string): Promise<DocType> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_doc_create(?)', [descripcion]);
    const [docRows] = normalizeResultSets(rows);

    if (!docRows || docRows.length === 0) {
      throw new Error('No se pudo crear el tipo de documento');
    }

    const docRow = docRows[0];

    if (!docRow) {
      throw new Error('No se pudo crear el tipo de documento');
    }

    return mapDocType(docRow);
  }

  static async update(codigo: number, descripcion: string): Promise<DocType | null> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_doc_update(?, ?)', [codigo, descripcion]);
    const [docRows] = normalizeResultSets(rows);

    if (!docRows || docRows.length === 0) {
      return null;
    }

    const docRow = docRows[0];

    if (!docRow) {
      return null;
    }

    return mapDocType(docRow);
  }

  static async remove(codigo: number): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_doc_delete(?)', [codigo]);
    const affected = extractAffected(rows);

    return affected > 0;
  }
}


