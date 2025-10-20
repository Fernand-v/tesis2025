import { Modelo } from '../../types/Catalog';
export default class ModeloService {
    static list(): Promise<Modelo[]>;
    static create(descripcion: string): Promise<Modelo>;
    static update(codigo: number, descripcion: string): Promise<Modelo | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=ModeloService.d.ts.map