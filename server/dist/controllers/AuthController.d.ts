import type { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
declare const AuthController: {
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    profile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
};
export default AuthController;
//# sourceMappingURL=AuthController.d.ts.map