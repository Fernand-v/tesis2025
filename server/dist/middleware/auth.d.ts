import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export interface AuthenticatedRequest extends Request {
    auth?: jwt.JwtPayload & {
        sub?: string | number | undefined;
        username?: string | undefined;
        role?: number | undefined;
    };
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export default authenticateToken;
//# sourceMappingURL=auth.d.ts.map