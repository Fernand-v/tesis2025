import { PedidoVenta, PedidoVentaInput } from '../../types/Catalog';
export declare class CajaAperturaRequiredError extends Error {
    constructor();
}
export type PedidoSearchFilters = {
    personaCodigo?: number | null;
    estadoCodigo?: number | null;
    fechaDesde?: string | null;
    fechaHasta?: string | null;
    texto?: string | null;
};
export default class PedidoVentaService {
    static search(filters: PedidoSearchFilters): Promise<PedidoVenta[]>;
    static list(): Promise<PedidoVenta[]>;
    static get(codigo: number): Promise<PedidoVenta | null>;
    static create(data: PedidoVentaInput, usuarioCodigo: number): Promise<PedidoVenta>;
}
//# sourceMappingURL=PedidoVentaService.d.ts.map