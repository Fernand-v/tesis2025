import { Dispositivo, Marca, Modelo } from '../../types/Catalog';
export default class DispositivoService {
    static list(): Promise<Dispositivo[]>;
    static create(data: {
        descripcion: string;
        modeloCodigo: number;
        marcaCodigo: number;
        ram: number;
        rom: number;
    }): Promise<Dispositivo>;
    static update(codigo: number, data: {
        descripcion: string;
        modeloCodigo: number;
        marcaCodigo: number;
        ram: number;
        rom: number;
    }): Promise<Dispositivo | null>;
    static remove(codigo: number): Promise<boolean>;
    static listModelos(): Promise<Modelo[]>;
    static listMarcas(): Promise<Marca[]>;
    static lookups(): Promise<{
        modelos: Modelo[];
        marcas: Marca[];
    }>;
}
//# sourceMappingURL=DispositivoService.d.ts.map