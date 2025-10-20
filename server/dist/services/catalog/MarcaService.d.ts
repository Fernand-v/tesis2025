import { Marca } from '../../types/Catalog';
export default class MarcaService {
    static list(): Promise<Marca[]>;
    static create(descripcion: string): Promise<Marca>;
    static update(codigo: number, descripcion: string): Promise<Marca | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=MarcaService.d.ts.map