import { Caja, CajaUsuario, UsuarioBasico } from '../../types/Catalog';
export default class CajaUsuarioService {
    static listAsignaciones(): Promise<CajaUsuario[]>;
    static listUsuarios(): Promise<UsuarioBasico[]>;
    static create(cajaCodigo: number, usuarioCodigo: number): Promise<CajaUsuario[]>;
    static remove(cajaCodigo: number, usuarioCodigo: number): Promise<boolean>;
    static overview(): Promise<{
        asignaciones: CajaUsuario[];
        cajas: Caja[];
        usuarios: UsuarioBasico[];
    }>;
}
//# sourceMappingURL=CajaUsuarioService.d.ts.map