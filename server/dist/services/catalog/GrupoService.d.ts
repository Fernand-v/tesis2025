import { Grupo } from '../../types/Catalog';
export default class GrupoService {
    static list(): Promise<Grupo[]>;
    static create(descripcion: string): Promise<Grupo>;
    static update(codigo: number, descripcion: string): Promise<Grupo | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=GrupoService.d.ts.map