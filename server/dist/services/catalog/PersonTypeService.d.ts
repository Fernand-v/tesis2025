import { PersonType } from '../../types/Catalog';
export default class PersonTypeService {
    static list(): Promise<PersonType[]>;
    static create(descripcion: string): Promise<PersonType>;
    static update(codigo: number, descripcion: string): Promise<PersonType | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=PersonTypeService.d.ts.map