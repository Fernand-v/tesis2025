"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = __importDefault(require("../../database/pool"));
const normalizeResultSets = (rows) => {
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.filter((set) => Array.isArray(set));
};
const mapDocType = (row) => ({
    codigo: Number(row.TDOC_CODIGO),
    descripcion: String(row.TDOC_DESC),
});
const extractAffected = (rows) => {
    const resultSets = normalizeResultSets(rows);
    if (!resultSets[0] || resultSets[0].length === 0) {
        return 0;
    }
    const record = resultSets[0][0];
    return Number(record.affected ?? 0);
};
class DocTypeService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_doc_list()');
        const [docRows] = normalizeResultSets(rows);
        return (docRows ?? []).map(mapDocType);
    }
    static async get(codigo) {
        const pool = (0, pool_1.default)();
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
    static async create(descripcion) {
        const pool = (0, pool_1.default)();
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
    static async update(codigo, descripcion) {
        const pool = (0, pool_1.default)();
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
    static async remove(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_gen_tpo_doc_delete(?)', [codigo]);
        const affected = extractAffected(rows);
        return affected > 0;
    }
}
exports.default = DocTypeService;
//# sourceMappingURL=DocTypeService.js.map