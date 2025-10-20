import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
export declare const requireRole: (allowedRoles: number[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export default requireRole;
//# sourceMappingURL=roles.d.ts.map