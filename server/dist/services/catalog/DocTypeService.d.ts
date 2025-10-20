import { DocType } from '../../types/Catalog';
export default class DocTypeService {
    static list(): Promise<DocType[]>;
    static get(codigo: number): Promise<DocType | null>;
    static create(descripcion: string): Promise<DocType>;
    static update(codigo: number, descripcion: string): Promise<DocType | null>;
    static remove(codigo: number): Promise<boolean>;
}
//# sourceMappingURL=DocTypeService.d.ts.map