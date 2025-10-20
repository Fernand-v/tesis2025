import { CurrencyType } from '../../types/Catalog';
export default class CurrencyTypeService {
    static list(): Promise<CurrencyType[]>;
    static get(codigo: number): Promise<CurrencyType | null>;
    static create(data: {
        denominacion: string;
        tasa: number;
        simbolo: string;
    }): Promise<CurrencyType>;
    static update(codigo: number, data: {
        denominacion: string;
        tasa: number;
        simbolo: string;
    }): Promise<CurrencyType | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=CurrencyTypeService.d.ts.map