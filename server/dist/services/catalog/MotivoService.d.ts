import { Motivo } from '../../types/Catalog';
export default class MotivoService {
    static list(): Promise<Motivo[]>;
    static create(descripcion: string): Promise<Motivo>;
    static update(codigo: number, descripcion: string): Promise<Motivo | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=MotivoService.d.ts.map