import { ProgramType } from '../../types/Catalog';
export default class ProgramTypeService {
    static list(): Promise<ProgramType[]>;
    static create(descripcion: string): Promise<ProgramType>;
    static update(codigo: number, descripcion: string): Promise<ProgramType | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=ProgramTypeService.d.ts.map