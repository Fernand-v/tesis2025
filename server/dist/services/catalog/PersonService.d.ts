import { Person, PersonDetail, PersonInput } from '../../types/Catalog';
export default class PersonService {
    static list(): Promise<Person[]>;
    static getDetail(codigo: number): Promise<PersonDetail | null>;
    static create(data: PersonInput): Promise<PersonDetail | null>;
    static update(codigo: number, data: PersonInput): Promise<PersonDetail | null>;
    static remove(codigo: number): Promise<boolean>;
    static addType(personaCodigo: number, tipoCodigo: number): Promise<PersonDetail | null>;
    static removeType(personaCodigo: number, tipoCodigo: number): Promise<PersonDetail | null>;
}
//# sourceMappingURL=PersonService.d.ts.map