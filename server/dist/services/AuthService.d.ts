import { User } from '../types/User';
import { Program } from '../types/Program';
export interface RegisterPayload {
    username: string;
    password: string;
    nombre: string;
    apellido: string;
    correo?: string;
    telefono?: string;
    celular?: string;
    direccion?: string;
    grabUserId?: number | null;
}
export interface LoginPayload {
    username: string;
    password: string;
}
export default class AuthService {
    static register(payload: RegisterPayload): Promise<{
        user: User;
    }>;
    static login(payload: LoginPayload): Promise<{
        user: User;
        token: string;
    } | null>;
    static getProfile(userId: number): Promise<{
        user: User;
        programs: Program[];
    } | null>;
}
//# sourceMappingURL=AuthService.d.ts.map