import { Empresa } from '../../types/Catalog';
export default class EmpresaService {
    static list(): Promise<Empresa[]>;
    static get(codigo: number): Promise<Empresa | null>;
    static create(data: {
        razonSocial: string;
        ruc: string;
        telefono: string | null;
        celular: string;
        direccion: string;
        logo: string | null;
    }): Promise<Empresa>;
    static update(codigo: number, data: {
        razonSocial: string;
        ruc: string;
        telefono: string | null;
        celular: string;
        direccion: string;
        logo: string | null;
    }): Promise<Empresa | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=EmpresaService.d.ts.map