import { Caja } from '../../types/Catalog';
export default class CajaService {
    static list(): Promise<Caja[]>;
    static create(descripcion: string): Promise<Caja>;
    static update(codigo: number, descripcion: string): Promise<Caja | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=CajaService.d.ts.map