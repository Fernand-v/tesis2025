import { PoolConnection, RowDataPacket } from 'mysql2/promise';

import getPool from '../../database/pool';
import {
  ArqueoCaja,
  ArqueoDetalle,
  ArqueoDetalleInput,
} from '../../types/Catalog';
import { CajaAperturaRequiredError } from './PedidoVentaService';

const normalizeResultSets = (rows: unknown): RowDataPacket[][] => {
  if (!Array.isArray(rows)) {
    return [];
  }
  return (rows as unknown[]).filter((set): set is RowDataPacket[] => Array.isArray(set));
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

const mapDetalle = (row: RowDataPacket): ArqueoDetalle => ({
  codigo: Number(row.DARQ_CODIGO),
  aperturaCodigo: Number(row.DARQ_APERTURA),
  fecha: row.DARQ_FECHA ? new Date(row.DARQ_FECHA).toISOString() : new Date().toISOString(),
  descripcion: row.DARQ_DESCRIPCION === null || typeof row.DARQ_DESCRIPCION === 'undefined'
    ? null
    : String(row.DARQ_DESCRIPCION),
  tipo: row.DARQ_TIPO === null || typeof row.DARQ_TIPO === 'undefined' ? '' : String(row.DARQ_TIPO),
  monedaCodigo: row.DARQ_TPO_MONEDA === null || typeof row.DARQ_TPO_MONEDA === 'undefined'
    ? null
    : Number(row.DARQ_TPO_MONEDA),
  monedaDenominacion: row.TMON_DENOMINACION === null || typeof row.TMON_DENOMINACION === 'undefined'
    ? null
    : String(row.TMON_DENOMINACION),
  monedaSimbolo: row.TMON_SIMBOLO === null || typeof row.TMON_SIMBOLO === 'undefined'
    ? null
    : String(row.TMON_SIMBOLO),
  tasa: row.TMON_TASA === null || typeof row.TMON_TASA === 'undefined' ? null : Number(row.TMON_TASA),
  cantidad: row.DARQ_CANTIDAD === null || typeof row.DARQ_CANTIDAD === 'undefined'
    ? null
    : Number(row.DARQ_CANTIDAD),
  monto: Number(row.DARQ_MONTO ?? 0),
});

const mapArqueo = (row: RowDataPacket, detalles: ArqueoDetalle[]): ArqueoCaja => {
  const totalCreditos = detalles
    .filter((detalle) => detalle.tipo === 'C')
    .reduce((acc, detalle) => acc + detalle.monto, 0);
  const totalDebitos = detalles
    .filter((detalle) => detalle.tipo === 'D')
    .reduce((acc, detalle) => acc + detalle.monto, 0);
  const motivoDirecto =
    row.ARQ_MOTIVO === null || typeof row.ARQ_MOTIVO === 'undefined' ? null : String(row.ARQ_MOTIVO);
  const motivo = motivoDirecto ?? detalles.find((detalle) => detalle.tipo === 'D' && detalle.descripcion)?.descripcion ?? null;

  return {
    codigo: Number(row.ARQ_CODIGO),
    aperturaCodigo: Number(row.ARQ_APERTURA),
    fecha: new Date(row.ARQ_FECHA).toISOString().slice(0, 10),
    estado: Number(row.ARQ_ESTADO),
    cajaCodigo: Number(row.APCAJ_CAJA),
    cajaDescripcion: String(row.CAJ_DESC),
    usuarioCodigo: Number(row.APCAJ_USER),
    usuarioUsername: String(row.USER_USUARIO),
    usuarioNombre: String(row.USER_NOMBRE),
    usuarioApellido: String(row.USER_APELLIDO),
    montoApertura: Number(row.APCAJ_MONTO_APER ?? 0),
    saldoAnterior: Number(row.APCAJ_MONTO_ANT ?? 0),
    totalCreditos,
    totalDebitos,
    total: totalDebitos,
    motivo,
    detalles,
  };
};

export class ArqueoAlreadyRegisteredError extends Error {
  constructor() {
    super('Ya existe un arqueo registrado para esta apertura');
    this.name = 'ArqueoAlreadyRegisteredError';
  }
}

export class ArqueoSaldoMismatchError extends Error {
  expected: number;
  provided: number;

  constructor(expected: number, provided: number) {
    super('El monto a retirar supera el saldo disponible');
    this.name = 'ArqueoSaldoMismatchError';
    this.expected = expected;
    this.provided = provided;
  }
}

export class AperturaOwnerMismatchError extends Error {
  constructor() {
    super('No puedes operar sobre una apertura de otro usuario');
    this.name = 'AperturaOwnerMismatchError';
  }
}

export class AperturaInactivaError extends Error {
  constructor() {
    super('La apertura seleccionada no esta activa');
    this.name = 'AperturaInactivaError';
  }
}

type ArqueoListOptions = {
  usuarioCodigo?: number | null;
  aperturaCodigo?: number | null;
};

type ResumenDisponible = {
  aperturaCodigo: number;
  cajaCodigo: number;
  cajaDescripcion: string;
  aperturaFecha: string;
  usuarioCodigo: number;
  usuarioUsername: string;
  usuarioNombre: string;
  usuarioApellido: string;
  montoApertura: number;
  saldoAnterior: number;
  totalCreditos: number;
  totalDebitos: number;
  saldoDisponible: number;
};

export default class ArqueoCajaService {
  private static async findActiveApertura(connection: PoolConnection, usuarioCodigo: number): Promise<number> {
    const [rows] = await connection.query('CALL tesis2025.sp_fin_apertura_activa_por_usuario(?)', [usuarioCodigo]);
    const set = findFirstSet(rows);
    const first = set[0];

    if (!first) {
      throw new CajaAperturaRequiredError();
    }

    return Number(first.APCAJ_CODIGO);
  }

  private static async fetchApertura(
    connection: PoolConnection,
    codigo: number,
    lock: boolean,
  ): Promise<RowDataPacket | null> {
    const procedure = lock
      ? 'CALL tesis2025.sp_fin_apertura_caja_lock(?)'
      : 'CALL tesis2025.sp_fin_apertura_caja_get(?)';
    const [rows] = await connection.query(procedure, [codigo]);
    const resultRows = findFirstSet(rows);
    return resultRows[0] ?? null;
  }

  private static async resolveAperturaCodigo(
    connection: PoolConnection,
    usuarioCodigo: number,
    aperturaCodigo: number | null | undefined,
    lock: boolean,
  ): Promise<RowDataPacket> {
    let codigoObjetivo: number;
    if (typeof aperturaCodigo === 'number' && Number.isFinite(aperturaCodigo)) {
      codigoObjetivo = Number(aperturaCodigo);
    } else {
      codigoObjetivo = await this.findActiveApertura(connection, usuarioCodigo);
    }

    const apertura = await this.fetchApertura(connection, codigoObjetivo, lock);
    if (!apertura) {
      throw new Error('Apertura no encontrada');
    }

    if (Number(apertura.APCAJ_USER) !== usuarioCodigo) {
      throw new AperturaOwnerMismatchError();
    }

    if (Number(apertura.APCAJ_ESTADO) !== 1) {
      throw new AperturaInactivaError();
    }

    return apertura;
  }

  private static async fetchMonedaInfo(
    connection: PoolConnection,
    codigo: number,
  ): Promise<{ tasa: number; denominacion: string; simbolo: string }> {
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

  static async list(options: ArqueoListOptions = {}): Promise<ArqueoCaja[]> {
    const pool = getPool();
    const usuarioFiltro = options.usuarioCodigo ?? null;
    const aperturaFiltro = options.aperturaCodigo ?? null;

    const [rows] = await pool.query('CALL tesis2025.sp_fin_arqueo_caja_list(?, ?)', [
      usuarioFiltro,
      aperturaFiltro,
    ]);

    const sets = normalizeResultSets(rows);
    const headerRows = sets[0] ?? [];
    const detailRows = sets[1] ?? [];

    if (headerRows.length === 0) {
      return [];
    }

    const detallesMap = new Map<number, ArqueoDetalle[]>();

    for (const row of detailRows) {
      const detalle = mapDetalle(row);
      const current = detallesMap.get(detalle.aperturaCodigo) ?? [];
      current.push(detalle);
      detallesMap.set(detalle.aperturaCodigo, current);
    }

    return headerRows.map((row) => {
      const aperturaCodigo = Number(row.ARQ_APERTURA);
      const detalles = detallesMap.get(aperturaCodigo) ?? [];
      return mapArqueo(row, detalles);
    });
  }

  static async get(aperturaCodigo: number): Promise<ArqueoCaja | null> {
    const [arqueo] = await this.list({ aperturaCodigo });
    return arqueo ?? null;
  }

  static async obtenerResumenDisponible(
    usuarioCodigo: number,
    aperturaCodigo?: number | null,
  ): Promise<ResumenDisponible> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const apertura = await this.resolveAperturaCodigo(connection, usuarioCodigo, aperturaCodigo, false);

      const [rows] = await connection.query('CALL tesis2025.sp_fin_arqueo_caja_resumen(?)', [
        Number(apertura.APCAJ_CODIGO),
      ]);
      const resumenRows = findFirstSet(rows);
      const first = resumenRows[0];
      if (!first) {
        throw new Error('No se pudo calcular el saldo disponible');
      }

      const totalCreditos = Number(first.TOTAL_CREDITO ?? 0);
      const totalDebitos = Number(first.TOTAL_DEBITO ?? 0);

      const saldoDisponible =
        Number(first.APCAJ_MONTO_APER ?? apertura.APCAJ_MONTO_APER ?? 0) +
        Number(first.APCAJ_MONTO_ANT ?? apertura.APCAJ_MONTO_ANT ?? 0) +
        totalCreditos -
        totalDebitos;

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
        montoApertura: Number(first.APCAJ_MONTO_APER ?? apertura.APCAJ_MONTO_APER ?? 0),
        saldoAnterior: Number(first.APCAJ_MONTO_ANT ?? apertura.APCAJ_MONTO_ANT ?? 0),
        totalCreditos,
        totalDebitos,
        saldoDisponible,
      };
    } finally {
      connection.release();
    }
  }

  static async create(
    data: {
      aperturaCodigo?: number | null;
      usuarioCodigo: number;
      motivo: string;
      detalles: ArqueoDetalleInput[];
    },
  ): Promise<ArqueoCaja> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const motivo = typeof data.motivo === 'string' ? data.motivo.trim() : '';
      if (!motivo) {
        throw new Error('El motivo del arqueo es obligatorio');
      }

      const detallesFiltrados = (data.detalles ?? []).filter((detalle) => {
        if (typeof detalle !== 'object' || detalle === null) {
          return false;
        }
        const monedaCodigo = Number((detalle as { monedaCodigo?: unknown }).monedaCodigo);
        const cantidad = Number((detalle as { cantidad?: unknown }).cantidad);
        if (!Number.isFinite(monedaCodigo) || monedaCodigo <= 0) {
          return false;
        }
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          return false;
        }
        return true;
      }) as ArqueoDetalleInput[];

      if (detallesFiltrados.length === 0) {
        throw new Error('Ingresa al menos una moneda con cantidad mayor a cero');
      }

      const apertura = await this.resolveAperturaCodigo(
        connection,
        data.usuarioCodigo,
        data.aperturaCodigo,
        true,
      );

      const [resumenRows] = await connection.query('CALL tesis2025.sp_fin_arqueo_caja_resumen(?)', [
        Number(apertura.APCAJ_CODIGO),
      ]);
      const resumenSet = findFirstSet(resumenRows);
      const resumen = resumenSet[0];
      if (!resumen) {
        throw new Error('No se pudo calcular el saldo disponible');
      }

      const totalCreditos = Number(resumen.TOTAL_CREDITO ?? 0);
      const totalDebitosPrevios = Number(resumen.TOTAL_DEBITO ?? 0);


      const uniqueMonedas = Array.from(new Set(detallesFiltrados.map((detalle) => detalle.monedaCodigo)));
      const monedaMap = new Map<number, { tasa: number; denominacion: string; simbolo: string }>();

      for (const monedaCodigo of uniqueMonedas) {
        const info = await this.fetchMonedaInfo(connection, monedaCodigo);
        monedaMap.set(monedaCodigo, info);
      }

      const detallesConMonto = detallesFiltrados.map((detalle) => {
        const info = monedaMap.get(detalle.monedaCodigo);
        if (!info) {
          throw new Error('Existe una moneda invalida en el detalle del arqueo');
        }
        return {
          ...detalle,
          monto: info.tasa * detalle.cantidad,
        };
      });

      const totalDetalle = detallesConMonto.reduce((acc, detalle) => acc + detalle.monto, 0);
      const montoApertura = Number(resumen.APCAJ_MONTO_APER ?? apertura.APCAJ_MONTO_APER ?? 0);
      const saldoAnterior = Number(resumen.APCAJ_MONTO_ANT ?? apertura.APCAJ_MONTO_ANT ?? 0);
      const saldoDisponible = montoApertura + saldoAnterior + totalCreditos;

      if (totalDetalle - saldoDisponible > 0.5) {
        throw new ArqueoSaldoMismatchError(saldoDisponible, totalDetalle);
      }

      let firstDetalle = true;
      for (const detalle of detallesFiltrados) {
        await connection.query('CALL tesis2025.sp_fin_arqueo_caja_registrar_retiro(?, ?, ?, ?, ?)', [
          Number(apertura.APCAJ_CODIGO),
          detalle.monedaCodigo,
          detalle.cantidad,
          motivo,
          firstDetalle ? 1 : 0,
        ]);
        firstDetalle = false;
      }

      await connection.commit();

      const arqueo = await this.get(Number(apertura.APCAJ_CODIGO));
      if (!arqueo) {
        throw new Error('No se pudo recuperar el arqueo registrado');
      }

      return arqueo;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
