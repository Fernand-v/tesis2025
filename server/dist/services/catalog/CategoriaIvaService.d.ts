import { CategoriaIva } from '../../types/Catalog';
export default class CategoriaIvaService {
    static list(): Promise<CategoriaIva[]>;
    static create(descripcion: string, tasa: number): Promise<CategoriaIva>;
    static update(codigo: number, descripcion: string, tasa: number): Promise<CategoriaIva | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=CategoriaIvaService.d.ts.map