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
const findFirstSet = (rows) => {
    const sets = normalizeResultSets(rows);
    for (const set of sets) {
        if (set.length > 0) {
            return set;
        }
    }
    return [];
};
const mapApertura = (row) => ({
    codigo: Number(row.APCAJ_CODIGO),
    fecha: new Date(row.APCAJ_FECHA).toISOString().slice(0, 10),
    monto: Number(row.APCAJ_MONTO_APER),
    cajaCodigo: Number(row.APCAJ_CAJA),
    cajaDescripcion: String(row.CAJ_DESC),
    usuarioCodigo: Number(row.APCAJ_USER),
    usuarioUsername: String(row.USER_USUARIO),
    usuarioNombre: String(row.USER_NOMBRE),
    usuarioApellido: String(row.USER_APELLIDO),
    estadoCodigo: Number(row.APCAJ_ESTADO),
    estadoDescripcion: String(row.EST_DESC),
    fechaGrabacion: new Date(row.APCAJ_FEC_GRAB).toISOString(),
    detalles: [],
    subtotal: Number(row.APCAJ_MONTO_APER),
});
const mapDetalle = (row) => {
    const cantidad = Number(row.DAPCAJ_CANTIDAD ?? 0);
    const tasa = Number(row.TMON_TASA ?? 0);
    return {
        aperturaCodigo: Number(row.DAPCAJ_APERTURA),
        monedaCodigo: Number(row.DAPCAJ_TPO_MONEDA),
        denominacion: String(row.TMON_DENOMINACION),
        tasa,
        cantidad,
        monto: tasa * cantidad,
    };
};
const insertDetalles = async (conn, aperturaCodigo, detalles) => {
    if (detalles.length === 0) {
        return;
    }
    for (const detalle of detalles) {
        await conn.query(`
        INSERT INTO fin_detalle_apertura_caja (
          DAPCAJ_APERTURA,
          DAPCAJ_TPO_MONEDA,
          DAPCAJ_CANTIDAD
        ) VALUES (?, ?, ?)
      `, [aperturaCodigo, detalle.monedaCodigo, detalle.cantidad]);
    }
};
const buildDetalleFilter = (codigos) => {
    if (codigos.length === 0) {
        return ['', []];
    }
    const placeholders = codigos.map(() => '?').join(', ');
    return [
        `
      SELECT det.DAPCAJ_APERTURA,
             det.DAPCAJ_TPO_MONEDA,
             det.DAPCAJ_CANTIDAD,
             mon.TMON_DENOMINACION,
             mon.TMON_TASA,
             mon.TMON_SIMBOLO
        FROM fin_detalle_apertura_caja det
        JOIN gen_tpo_moneda mon
          ON mon.TMON_CODIGO = det.DAPCAJ_TPO_MONEDA
       WHERE det.DAPCAJ_APERTURA IN (${placeholders})
       ORDER BY mon.TMON_DENOMINACION
    `,
        codigos,
    ];
};
class AperturaCajaService {
    static async list() {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_apertura_caja_list()');
        const aperturasRows = findFirstSet(rows);
        const aperturas = aperturasRows.map(mapApertura);
        if (aperturas.length === 0) {
            return [];
        }
        const [detailQuery, params] = buildDetalleFilter(aperturas.map((apertura) => apertura.codigo));
        if (!detailQuery) {
            return aperturas;
        }
        const [detailRows] = await pool.query(detailQuery, params);
        const detalles = detailRows.map(mapDetalle);
        const detailMap = new Map();
        for (const detalle of detalles) {
            const current = detailMap.get(detalle.aperturaCodigo) ?? [];
            current.push({
                monedaCodigo: detalle.monedaCodigo,
                denominacion: detalle.denominacion,
                tasa: detalle.tasa,
                cantidad: detalle.cantidad,
                monto: detalle.monto,
            });
            detailMap.set(detalle.aperturaCodigo, current);
        }
        return aperturas.map((apertura) => {
            const aperturaDetalles = detailMap.get(apertura.codigo) ?? [];
            const subtotal = aperturaDetalles.length === 0
                ? apertura.monto
                : aperturaDetalles.reduce((acc, item) => acc + item.monto, 0);
            return { ...apertura, detalles: aperturaDetalles, subtotal };
        });
    }
    static async get(codigo) {
        const pool = (0, pool_1.default)();
        const [rows] = await pool.query('CALL tesis2025.sp_fin_apertura_caja_get(?)', [codigo]);
        const aperturaRows = findFirstSet(rows);
        const first = aperturaRows[0];
        if (!first) {
            return null;
        }
        const apertura = mapApertura(first);
        const [detailRows] = await pool.query(`
        SELECT det.DAPCAJ_APERTURA,
               det.DAPCAJ_TPO_MONEDA,
               det.DAPCAJ_CANTIDAD,
               mon.TMON_DENOMINACION,
               mon.TMON_TASA,
               mon.TMON_SIMBOLO
          FROM fin_detalle_apertura_caja det
          JOIN gen_tpo_moneda mon
            ON mon.TMON_CODIGO = det.DAPCAJ_TPO_MONEDA
         WHERE det.DAPCAJ_APERTURA = ?
         ORDER BY mon.TMON_DENOMINACION
      `, [codigo]);
        const detalles = detailRows.map(mapDetalle);
        const detalleList = detalles.map((detalle) => ({
            monedaCodigo: detalle.monedaCodigo,
            denominacion: detalle.denominacion,
            tasa: detalle.tasa,
            cantidad: detalle.cantidad,
            monto: detalle.monto,
        }));
        const subtotal = detalleList.length === 0
            ? apertura.monto
            : detalleList.reduce((acc, item) => acc + item.monto, 0);
        return { ...apertura, detalles: detalleList, subtotal };
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const detalleFiltrado = (data.detalles ?? []).filter((detalle) => detalle.cantidad > 0);
            let total = 0;
            if (detalleFiltrado.length > 0) {
                const [tasasRows] = await connection.query(`
            SELECT TMON_CODIGO, TMON_TASA
              FROM gen_tpo_moneda
             WHERE TMON_CODIGO IN (?)
          `, [detalleFiltrado.map((detalle) => detalle.monedaCodigo)]);
                const tasaMap = new Map();
                tasasRows.forEach((row) => {
                    tasaMap.set(Number(row.TMON_CODIGO), Number(row.TMON_TASA));
                });
                total = detalleFiltrado.reduce((acc, detalle) => {
                    const tasa = tasaMap.get(detalle.monedaCodigo) ?? 0;
                    return acc + tasa * detalle.cantidad;
                }, 0);
            }
            const [rows] = await connection.query('CALL tesis2025.sp_fin_apertura_caja_create(?, ?, ?, ?)', [
                total,
                data.cajaCodigo,
                data.usuarioCodigo,
                1,
            ]);
            const aperturaRows = findFirstSet(rows);
            const first = aperturaRows[0];
            if (!first) {
                throw new Error('No se pudo registrar la apertura');
            }
            const aperturaCodigo = Number(first.APCAJ_CODIGO);
            await insertDetalles(connection, aperturaCodigo, detalleFiltrado);
            await connection.commit();
            const apertura = await this.get(aperturaCodigo);
            if (!apertura) {
                throw new Error('No se pudo recuperar la apertura creada');
            }
            return apertura;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
}
exports.default = AperturaCajaService;
//# sourceMappingURL=AperturaCajaService.js.map