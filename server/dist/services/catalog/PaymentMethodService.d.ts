import { PaymentMethod } from '../../types/Catalog';
export default class PaymentMethodService {
    static list(): Promise<PaymentMethod[]>;
    static create(descripcion: string): Promise<PaymentMethod>;
    static update(codigo: number, descripcion: string): Promise<PaymentMethod | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=PaymentMethodService.d.ts.map