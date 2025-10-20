import { Program } from '../../types/Program';
import { Role, RoleDetail } from '../../types/Catalog';
export default class RoleService {
    static list(): Promise<Role[]>;
    static getDetail(codigo: number): Promise<RoleDetail | null>;
    static create(descripcion: string): Promise<Role>;
    static update(codigo: number, descripcion: string): Promise<Role | null>;
    static remove(codigo: number): Promise<boolean>;
    static addProgram(codigo: number, programaCodigo: number): Promise<RoleDetail | null>;
    static removeProgram(codigo: number, programaCodigo: number): Promise<RoleDetail | null>;
    static listPrograms(): Promise<Program[]>;
}
//# sourceMappingURL=RoleService.d.ts.map