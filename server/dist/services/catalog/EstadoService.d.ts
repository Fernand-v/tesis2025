import { Estado } from '../../types/Catalog';
export default class EstadoService {
    static list(): Promise<Estado[]>;
    static get(codigo: number): Promise<Estado | null>;
    static create(descripcion: string): Promise<Estado>;
    static update(codigo: number, descripcion: string): Promise<Estado | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=EstadoService.d.ts.map