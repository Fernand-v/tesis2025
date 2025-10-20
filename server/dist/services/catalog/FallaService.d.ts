import { Falla } from '../../types/Catalog';
export default class FallaService {
    static list(): Promise<Falla[]>;
    static create(descripcion: string): Promise<Falla>;
    static update(codigo: number, descripcion: string): Promise<Falla | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=FallaService.d.ts.map