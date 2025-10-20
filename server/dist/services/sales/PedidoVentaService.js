"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CajaAperturaRequiredError = void 0;
const pool_1 = __importDefault(require("../../database/pool"));
class CajaAperturaRequiredError extends Error {
    constructor() {
        super('No tienes una apertura de caja activa');
        this.name = 'CajaAperturaRequiredError';
    }
}
exports.CajaAperturaRequiredError = CajaAperturaRequiredError;
const normalizeResultSets = (rows) => {
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.filter((set) => Array.isArray(set));
};
const findFirstSet = (rows) => {
    const sets = normalizeResultSets(rows);
    for (const set of sets) {
        if (set.length > 0) {
            return set;
        }
    }
    return [];
};
const mapDetalle = (row) => {
    const cantidad = Number(row.DPED_CANTIDAD ?? 0);
    const precio = Number(row.DPED_PRECIO ?? 0);
    return {
        codigo: Number(row.DPED_CODIGO),
        itemCodigo: Number(row.DPED_ITEM),
        descripcion: String(row.ITEM_DESC),
        cantidad,
        precio,
        subtotal: cantidad * precio,
    };
};
const mapPedido = (row, detalles) => {
    const total = detalles.reduce((acc, detalle) => acc + detalle.subtotal, 0);
    return {
        codigo: Number(row.PED_CODIGO),
        fechaPedido: new Date(row.PED_FECHA_PEDIDO).toISOString().slice(0, 10),
        fechaEntrega: row.PED_FECHA_ENTREGA ? new Date(row.PED_FECHA_ENTREGA).toISOString().slice(0, 10) : null,
        observacion: row.PED_OBSERVACION === null ? null : String(row.PED_OBSERVACION),
        adelanto: Number(row.PED_ADELANTO ?? 0),
        fechaGrabacion: new Date(row.PED_FEC_GRAB).toISOString(),
        personaCodigo: Number(row.PED_PERSONA),
        personaNombre: String(row.PERSONA_NOMBRE ?? '').trim(),
        aperturaCodigo: Number(row.PED_APERTURA),
        usuarioGrabacion: Number(row.PED_USER_GRAB),
        estado: Number(row.PED_ESTADO),
        estadoDescripcion: row.ESTADO_DESCRIPCION === null
            ? null
            : String(row.ESTADO_DESCRIPCION).trim() || null,
        items: detalles,
        total,
    };
};
const getActiveApertura = async (conn, usuarioCodigo) => {
    const [rows] = await conn.query('CALL tesis2025.sp_fin_apertura_activa_por_usuario(?)', [usuarioCodigo]);
    const resultRows = findFirstSet(rows);
    const first = resultRows[0];
    if (!first) {
        throw new CajaAperturaRequiredError();
    }
    return Number(first.APCAJ_CODIGO);
};
const fetchPersonaNombre = async (conn, personaCodigo) => {
    const [rows] = await conn.query('CALL tesis2025.sp_gen_persona_get(?)', [personaCodigo]);
    const sets = normalizeResultSets(rows);
    const firstSet = sets[0] ?? [];
    const first = firstSet[0];
    if (!first) {
        throw new Error('Persona no encontrada');
    }
    const nombre = String(first.PER_NOMBRE ?? '').trim();
    const apellido = String(first.PER_APELLIDO ?? '').trim();
    const full = `${nombre} ${apellido}`.trim();
    return full || nombre || apellido || 'Persona';
};
const mapPedidosFromResult = (rows) => {
    const sets = normalizeResultSets(rows);
    const headerRows = sets[0] ?? [];
    const detailRows = sets[1] ?? [];
    const detailMap = new Map();
    for (const row of detailRows) {
        const pedidoCodigo = Number(row.DPED_PEDIDO);
        const detalles = detailMap.get(pedidoCodigo) ?? [];
        detalles.push(mapDetalle(row));
        detailMap.set(pedidoCodigo, detalles);
    }
    return headerRows.map((row) => {
        const codigo = Number(row.PED_CODIGO);
        const detalles = detailMap.get(codigo) ?? [];
        return mapPedido(row, detalles);
    });
};
const normalizeDate = (value) => value && value.trim() !== '' ? value : null;
class PedidoVentaService {
    static async search(filters) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_pedido_venta_search(?, ?, ?, ?, ?)', [
            filters.personaCodigo ?? null,
            filters.estadoCodigo ?? null,
            normalizeDate(filters.fechaDesde),
            normalizeDate(filters.fechaHasta),
            filters.texto && filters.texto.trim() !== '' ? filters.texto.trim() : null,
        ]);
        return mapPedidosFromResult(rows);
    }
    static async list() {
        return this.search({});
    }
    static async get(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_pedido_venta_get(?)', [codigo]);
        const pedidos = mapPedidosFromResult(rows);
        return pedidos[0] ?? null;
    }
    static async create(data, usuarioCodigo) {
        const pool = (0, pool_1.default)();
        const connection = await pool.getConnection();
        let pedidoCodigo = null;
        try {
            await connection.beginTransaction();
            const aperturaCodigo = await getActiveApertura(connection, usuarioCodigo);
            const personaNombre = await fetchPersonaNombre(connection, data.personaCodigo);
            const fechaEntregaValue = typeof data.fechaEntrega === 'string' && data.fechaEntrega.trim() !== ''
                ? data.fechaEntrega
                : null;
            const observacionValue = typeof data.observacion === 'string' && data.observacion.trim() !== ''
                ? data.observacion.trim()
                : null;
            const adelantoValue = Number.isFinite(Number(data.adelanto)) ? Number(data.adelanto) : 0;
            const [createRows] = await connection.query('CALL tesis2025.sp_fin_pedido_venta_create(?, ?, ?, ?, ?, ?, ?)', [
                data.fechaPedido,
                fechaEntregaValue,
                observacionValue,
                adelantoValue,
                data.personaCodigo,
                aperturaCodigo,
                usuarioCodigo,
            ]);
            const createSet = findFirstSet(createRows);
            const header = createSet[0];
            if (!header) {
                throw new Error('No se pudo crear el pedido de venta');
            }
            pedidoCodigo = Number(header.PED_CODIGO);
            if (data.items.length === 0) {
                throw new Error('El pedido debe contener al menos un item');
            }
            for (const item of data.items) {
                await connection.query('CALL tesis2025.sp_fin_pedido_venta_add_item(?, ?, ?, ?)', [
                    pedidoCodigo,
                    item.itemCodigo,
                    item.cantidad,
                    item.precio,
                ]);
            }
            if (adelantoValue > 0) {
                await connection.query('CALL tesis2025.sp_fin_pedido_venta_registrar_adelanto(?, ?, ?, ?)', [
                    pedidoCodigo,
                    aperturaCodigo,
                    adelantoValue,
                    `Adelanto de ${personaNombre}`,
                ]);
            }
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
        if (pedidoCodigo === null) {
            throw new Error('No se pudo determinar el codigo del pedido');
        }
        const pedido = await PedidoVentaService.get(pedidoCodigo);
        if (!pedido) {
            throw new Error('No se pudo recuperar el pedido creado');
        }
        return pedido;
    }
}
exports.default = PedidoVentaService;
//# sourceMappingURL=PedidoVentaService.js.map