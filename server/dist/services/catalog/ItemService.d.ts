import { CategoriaIva, Grupo, Item, ItemInput, Marca } from '../../types/Catalog';
export default class ItemService {
    static list(): Promise<Item[]>;
    static get(codigo: number): Promise<Item | null>;
    static create(data: ItemInput): Promise<Item>;
    static update(codigo: number, data: ItemInput): Promise<Item | null>;
    static remove(codigo: number): Promise<boolean>;
    static listCategorias(): Promise<CategoriaIva[]>;
    static overview(): Promise<{
        items: Item[];
        grupos: Grupo[];
        marcas: Marca[];
        categorias: CategoriaIva[];
    }>;
}
//# sourceMappingURL=ItemService.d.ts.map