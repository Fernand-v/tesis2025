import { AperturaCaja, AperturaCajaInput } from '../../types/Catalog';
export default class AperturaCajaService {
    static list(): Promise<AperturaCaja[]>;
    static get(codigo: number): Promise<AperturaCaja | null>;
    static create(data: AperturaCajaInput & {
        usuarioCodigo: number;
    }): Promise<AperturaCaja>;
}
//# sourceMappingURL=AperturaCajaService.d.ts.map