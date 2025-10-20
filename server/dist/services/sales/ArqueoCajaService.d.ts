import { ArqueoCaja, ArqueoDetalleInput } from '../../types/Catalog';
export declare class ArqueoAlreadyRegisteredError extends Error {
    constructor();
}
export declare class ArqueoSaldoMismatchError extends Error {
    expected: number;
    provided: number;
    constructor(expected: number, provided: number);
}
export declare class AperturaOwnerMismatchError extends Error {
    constructor();
}
export declare class AperturaInactivaError extends Error {
    constructor();
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
    private static findActiveApertura;
    private static fetchApertura;
    private static resolveAperturaCodigo;
    private static fetchMonedaInfo;
    static list(options?: ArqueoListOptions): Promise<ArqueoCaja[]>;
    static get(aperturaCodigo: number): Promise<ArqueoCaja | null>;
    static obtenerResumenDisponible(usuarioCodigo: number, aperturaCodigo?: number | null): Promise<ResumenDisponible>;
    static create(data: {
        aperturaCodigo?: number | null;
        usuarioCodigo: number;
        motivo: string;
        detalles: ArqueoDetalleInput[];
    }): Promise<ArqueoCaja>;
}
export {};
//# sourceMappingURL=ArqueoCajaService.d.ts.map