import { ProgramCatalog } from '../../types/Catalog';
export default class ProgramService {
    static list(): Promise<ProgramCatalog[]>;
    static create(data: {
        descripcion: string;
        ubicacion: string;
        formulario: string;
        habilitado: number;
        tipoCodigo: number;
    }): Promise<ProgramCatalog>;
    static update(codigo: number, data: {
        descripcion: string;
        ubicacion: string;
        formulario: string;
        habilitado: number;
        tipoCodigo: number;
    }): Promise<ProgramCatalog | null>;
    static remove(codigo: number): Promise<boolean>;
    static overview(): Promise<{
        programas: ProgramCatalog[];
        tipos: import("../../types/Catalog").ProgramType[];
    }>;
}
//# sourceMappingURL=ProgramService.d.ts.map