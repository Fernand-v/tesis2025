import { CierreCaja, CierreDetalleInput } from '../../types/Catalog';
export declare class CierreCajaAlreadyExistsError extends Error {
    constructor();
}
type CierreListOptions = {
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
    saldoTeorico: number;
};
export default class CierreCajaService {
    private static findActiveApertura;
    private static fetchApertura;
    private static resolveAperturaCodigo;
    private static fetchMonedaInfo;
    static list(options?: CierreListOptions): Promise<CierreCaja[]>;
    static get(aperturaCodigo: number): Promise<CierreCaja | null>;
    static obtenerResumenDisponible(usuarioCodigo: number, aperturaCodigo?: number | null): Promise<ResumenDisponible>;
    static create(data: {
        aperturaCodigo?: number | null;
        usuarioCodigo: number;
        detalles: CierreDetalleInput[];
    }): Promise<CierreCaja>;
}
export {};
//# sourceMappingURL=CierreCajaService.d.ts.map