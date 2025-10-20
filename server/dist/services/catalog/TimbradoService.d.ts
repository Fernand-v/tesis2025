import { Timbrado } from '../../types/Catalog';
export default class TimbradoService {
    static list(): Promise<Timbrado[]>;
    static get(codigo: number): Promise<Timbrado | null>;
    static create(data: Omit<Timbrado, 'codigo'>): Promise<Timbrado>;
    static update(codigo: number, data: Omit<Timbrado, 'codigo'>): Promise<Timbrado | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=TimbradoService.d.ts.map