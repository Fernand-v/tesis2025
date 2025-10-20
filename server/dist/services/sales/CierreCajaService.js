"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CierreCajaAlreadyExistsError = void 0;
const pool_1 = __importDefault(require("../../database/pool"));
const PedidoVentaService_1 = require("./PedidoVentaService");
const ArqueoCajaService_1 = require("./ArqueoCajaService");
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
    const cantidad = Number(row.DCCAJ_CANTIDAD ?? 0);
    const tasa = row.TMON_TASA === null || typeof row.TMON_TASA === 'undefined' ? null : Number(row.TMON_TASA);
    const monto = tasa === null ? cantidad : tasa * cantidad;
    return {
        aperturaCodigo: Number(row.DCCAJ_APERTURA),
        monedaCodigo: Number(row.DCCAJ_TPO_MONEDA),
        denominacion: row.TMON_DENOMINACION === null || typeof row.TMON_DENOMINACION === 'undefined'
            ? null
            : String(row.TMON_DENOMINACION),
        simbolo: row.TMON_SIMBOLO === null || typeof row.TMON_SIMBOLO === 'undefined' ? null : String(row.TMON_SIMBOLO),
        tasa,
        cantidad,
        monto,
    };
};
const mapCierre = (row, detalles) => ({
    aperturaCodigo: Number(row.CCAJ_APERTURA),
    fecha: new Date(row.CCAJ_FECHA).toISOString().slice(0, 10),
    monto: Number(row.CCAJ_MONTO ?? 0),
    diferencia: Number(row.CCAJ_DIFERENCIA ?? 0),
    cajaCodigo: Number(row.APCAJ_CAJA),
    cajaDescripcion: String(row.CAJ_DESC),
    usuarioCodigo: Number(row.APCAJ_USER),
    usuarioUsername: String(row.USER_USUARIO),
    usuarioNombre: String(row.USER_NOMBRE),
    usuarioApellido: String(row.USER_APELLIDO),
    montoApertura: Number(row.APCAJ_MONTO_APER ?? 0),
    saldoAnterior: Number(row.APCAJ_MONTO_ANT ?? 0),
    totalCreditos: Number(row.TOTAL_CREDITO ?? 0),
    totalDebitos: Number(row.TOTAL_DEBITO ?? 0),
    detalles,
});
class CierreCajaAlreadyExistsError extends Error {
    constructor() {
        super('La apertura ya fue cerrada');
        this.name = 'CierreCajaAlreadyExistsError';
    }
}
exports.CierreCajaAlreadyExistsError = CierreCajaAlreadyExistsError;
class CierreCajaService {
    static async findActiveApertura(connection, usuarioCodigo) {
        const [rows] = await connection.query('CALL tesis2025.sp_fin_apertura_activa_por_usuario(?)', [usuarioCodigo]);
        const set = findFirstSet(rows);
        const first = set[0];
        if (!first) {
            throw new PedidoVentaService_1.CajaAperturaRequiredError();
        }
        return Number(first.APCAJ_CODIGO);
    }
    static async fetchApertura(connection, codigo, lock) {
        const procedure = lock
            ? 'CALL tesis2025.sp_fin_apertura_caja_lock(?)'
            : 'CALL tesis2025.sp_fin_apertura_caja_get(?)';
        const [rows] = await connection.query(procedure, [codigo]);
        const resultRows = findFirstSet(rows);
        return resultRows[0] ?? null;
    }
    static async resolveAperturaCodigo(connection, usuarioCodigo, aperturaCodigo, lock) {
        let codigoObjetivo;
        if (typeof aperturaCodigo === 'number' && Number.isFinite(aperturaCodigo)) {
            codigoObjetivo = Number(aperturaCodigo);
        }
        else {
            codigoObjetivo = await this.findActiveApertura(connection, usuarioCodigo);
        }
        const apertura = await this.fetchApertura(connection, codigoObjetivo, lock);
        if (!apertura) {
            throw new Error('Apertura no encontrada');
        }
        if (Number(apertura.APCAJ_USER) !== usuarioCodigo) {
            throw new ArqueoCajaService_1.AperturaOwnerMismatchError();
        }
        if (Number(apertura.APCAJ_ESTADO) !== 1) {
            throw new ArqueoCajaService_1.AperturaInactivaError();
        }
        return apertura;
    }
    static async fetchMonedaInfo(connection, codigo) {
        const [rows] = await connection.query('CALL tesis2025.sp_gen_tpo_moneda_get(?)', [codigo]);
        const resultRows = findFirstSet(rows);
        const first = resultRows[0];
        if (!first) {
            throw new Error('Tipo de moneda no encontrado');
        }
        return {
            tasa: Number(first.TMON_TASA ?? 0),
            denominacion: String(first.TMON_DENOMINACION ?? ''),
            simbolo: String(first.TMON_SIMBOLO ?? ''),
        };
    }
    static async list(options = {}) {
        const pool = (0, pool_1.default)();
        const usuarioFiltro = options.usuarioCodigo ?? null;
        const aperturaFiltro = options.aperturaCodigo ?? null;
        const [rows] = await pool.query('CALL tesis2025.sp_fin_cierre_caja_list(?, ?)', [
            usuarioFiltro,
            aperturaFiltro,
        ]);
        const sets = normalizeResultSets(rows);
        const headerRows = sets[0] ?? [];
        const detailRows = sets[1] ?? [];
        if (headerRows.length === 0) {
            return [];
        }
        const detalleMap = new Map();
        for (const row of detailRows) {
            const detalle = mapDetalle(row);
            const current = detalleMap.get(detalle.aperturaCodigo) ?? [];
            current.push(detalle);
            detalleMap.set(detalle.aperturaCodigo, current);
        }
        return headerRows.map((row) => {
            const aperturaCodigo = Number(row.CCAJ_APERTURA);
            const detalles = detalleMap.get(aperturaCodigo) ?? [];
            return mapCierre(row, detalles);
        });
    }
    static async get(aperturaCodigo) {
        const [cierre] = await this.list({ aperturaCodigo });
        return cierre ?? null;
    }
    static async obtenerResumenDisponible(usuarioCodigo, aperturaCodigo) {
        const pool = (0, pool_1.default)();
        const connection = await pool.getConnection();
        try {
            const apertura = await this.resolveAperturaCodigo(connection, usuarioCodigo, aperturaCodigo, false);
            const [rows] = await connection.query('CALL tesis2025.sp_fin_arqueo_caja_resumen(?)', [
                Number(apertura.APCAJ_CODIGO),
            ]);
            const resumenRows = findFirstSet(rows);
            const first = resumenRows[0];
            if (!first) {
                throw new Error('No se pudo calcular el saldo teorico');
            }
            const totalCreditos = Number(first.TOTAL_CREDITO ?? 0);
            const totalDebitos = Number(first.TOTAL_DEBITO ?? 0);
            const montoApertura = Number(first.APCAJ_MONTO_APER ?? apertura.APCAJ_MONTO_APER ?? 0);
            const saldoAnterior = Number(first.APCAJ_MONTO_ANT ?? apertura.APCAJ_MONTO_ANT ?? 0);
            const saldoTeorico = montoApertura + totalCreditos - totalDebitos - saldoAnterior;
            return {
                aperturaCodigo: Number(first.APCAJ_CODIGO ?? apertura.APCAJ_CODIGO),
                cajaCodigo: Number(first.APCAJ_CAJA ?? apertura.APCAJ_CAJA),
                cajaDescripcion: String(first.CAJ_DESC ?? ''),
                aperturaFecha: first.APCAJ_FECHA
                    ? new Date(first.APCAJ_FECHA).toISOString().slice(0, 10)
                    : apertura.APCAJ_FECHA
                        ? new Date(apertura.APCAJ_FECHA).toISOString().slice(0, 10)
                        : new Date().toISOString().slice(0, 10),
                usuarioCodigo: Number(first.APCAJ_USER ?? apertura.APCAJ_USER),
                usuarioUsername: String(first.USER_USUARIO ?? ''),
                usuarioNombre: String(first.USER_NOMBRE ?? ''),
                usuarioApellido: String(first.USER_APELLIDO ?? ''),
                montoApertura,
                saldoAnterior,
                totalCreditos,
                totalDebitos,
                saldoTeorico,
            };
        }
        finally {
            connection.release();
        }
    }
    static async create(data) {
        const pool = (0, pool_1.default)();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const detallesFiltrados = (data.detalles ?? []).filter((detalle) => {
                if (typeof detalle !== 'object' || detalle === null) {
                    return false;
                }
                const monedaCodigo = Number(detalle.monedaCodigo);
                const cantidad = Number(detalle.cantidad);
                if (!Number.isFinite(monedaCodigo) || monedaCodigo <= 0) {
                    return false;
                }
                if (!Number.isFinite(cantidad) || cantidad < 0) {
                    return false;
                }
                return true;
            });
            if (detallesFiltrados.length === 0) {
                throw new Error('Ingresa al menos una moneda con cantidad mayor o igual a cero');
            }
            const existeCantidadPositiva = detallesFiltrados.some((detalle) => detalle.cantidad > 0);
            if (!existeCantidadPositiva) {
                throw new Error('Ingresa al menos una moneda con cantidad mayor a cero');
            }
            const apertura = await this.resolveAperturaCodigo(connection, data.usuarioCodigo, data.aperturaCodigo, true);
            const [resumenRows] = await connection.query('CALL tesis2025.sp_fin_arqueo_caja_resumen(?)', [
                Number(apertura.APCAJ_CODIGO),
            ]);
            const resumenSet = findFirstSet(resumenRows);
            const resumen = resumenSet[0];
            if (!resumen) {
                throw new Error('No se pudo calcular el saldo teorico');
            }
            const totalCreditos = Number(resumen.TOTAL_CREDITO ?? 0);
            const totalDebitos = Number(resumen.TOTAL_DEBITO ?? 0);
            const montoApertura = Number(resumen.APCAJ_MONTO_APER ?? apertura.APCAJ_MONTO_APER ?? 0);
            const saldoAnterior = Number(resumen.APCAJ_MONTO_ANT ?? apertura.APCAJ_MONTO_ANT ?? 0);
            const uniqueMonedas = Array.from(new Set(detallesFiltrados.map((detalle) => detalle.monedaCodigo)));
            const monedaMap = new Map();
            for (const monedaCodigo of uniqueMonedas) {
                const info = await this.fetchMonedaInfo(connection, monedaCodigo);
                monedaMap.set(monedaCodigo, info);
            }
            const detallesConMonto = detallesFiltrados.map((detalle) => {
                const info = monedaMap.get(detalle.monedaCodigo);
                if (!info) {
                    throw new Error('Existe una moneda invalida en el detalle del cierre');
                }
                return {
                    ...detalle,
                    monto: info.tasa * detalle.cantidad,
                };
            });
            const totalContado = detallesConMonto.reduce((acc, detalle) => acc + detalle.monto, 0);
            const saldoTeorico = montoApertura + totalCreditos - totalDebitos - saldoAnterior;
            const diferencia = totalContado - saldoTeorico;
            try {
                await connection.query('CALL tesis2025.sp_fin_cierre_caja_create(?, ?, ?, ?)', [
                    Number(apertura.APCAJ_CODIGO),
                    data.usuarioCodigo,
                    totalContado,
                    diferencia,
                ]);
            }
            catch (error) {
                if (error.message.includes('La apertura ya fue cerrada')) {
                    throw new CierreCajaAlreadyExistsError();
                }
                throw error;
            }
            await connection.query('CALL tesis2025.sp_fin_cierre_caja_clear_detail(?)', [
                Number(apertura.APCAJ_CODIGO),
            ]);
            for (const detalle of detallesFiltrados) {
                if (detalle.cantidad <= 0) {
                    continue;
                }
                await connection.query('CALL tesis2025.sp_fin_cierre_caja_add_detail(?, ?, ?)', [
                    Number(apertura.APCAJ_CODIGO),
                    detalle.monedaCodigo,
                    detalle.cantidad,
                ]);
            }
            await connection.commit();
            const cierre = await this.get(Number(apertura.APCAJ_CODIGO));
            if (!cierre) {
                throw new Error('No se pudo recuperar el cierre registrado');
            }
            return cierre;
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
exports.default = CierreCajaService;
//# sourceMappingURL=CierreCajaService.js.map